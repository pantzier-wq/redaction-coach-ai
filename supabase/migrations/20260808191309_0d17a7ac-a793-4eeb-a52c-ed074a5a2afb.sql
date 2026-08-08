-- 1. Tabela para rastrear tentativas de correção (proteção contra replay/duplicação)
CREATE TABLE IF NOT EXISTS public.essay_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tema TEXT NOT NULL,
    redacao_hash TEXT NOT NULL, -- Hash do texto para evitar reenviar a mesma redação em loop
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.essay_attempts TO authenticated;
GRANT ALL ON public.essay_attempts TO service_role;

ALTER TABLE public.essay_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias tentativas" 
ON public.essay_attempts FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem suas próprias tentativas" 
ON public.essay_attempts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Garantir que o handle_new_user e triggers estejam corretos
-- (Já existem no sistema conforme útil-contexto)

-- 3. Função principal de processamento (Server-Side Orchestrator)
-- Esta função será chamada pela Edge Function / Server Function
CREATE OR REPLACE FUNCTION public.execute_essay_correction_flow(
    _user_id UUID,
    _tema TEXT,
    _redacao TEXT,
    _attempt_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile RECORD;
    v_attempt_id UUID;
    v_credits_before INTEGER;
    v_unlimited BOOLEAN;
    v_allowed BOOLEAN := FALSE;
BEGIN
    -- 1. Obter perfil com trava
    SELECT * INTO v_profile FROM public.profiles WHERE id = _user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil não encontrado';
    END IF;

    v_credits_before := COALESCE(v_profile.credits, 0);
    v_unlimited := COALESCE(v_profile.has_full_access, false);

    -- 2. Validar permissão
    IF v_unlimited THEN
        v_allowed := TRUE;
    ELSIF COALESCE(v_profile.is_pro, false) AND v_credits_before > 0 THEN
        v_allowed := TRUE;
    END IF;

    IF NOT v_allowed THEN
        RETURN jsonb_build_object('ok', false, 'error', 'insufficient_credits', 'remaining', v_credits_before);
    END IF;

    -- 3. Registrar tentativa (se não fornecida)
    IF _attempt_id IS NULL THEN
        INSERT INTO public.essay_attempts (user_id, tema, redacao_hash, status)
        VALUES (_user_id, _tema, md5(_redacao), 'pending')
        RETURNING id INTO v_attempt_id;
    ELSE
        v_attempt_id := _attempt_id;
    END IF;

    -- 4. Consumir crédito (se não for ilimitado)
    IF NOT v_unlimited THEN
        UPDATE public.profiles SET credits = credits - 1 WHERE id = _user_id;
    END IF;

    -- Retorna sucesso para a server function prosseguir com a IA
    RETURN jsonb_build_object(
        'ok', true, 
        'attempt_id', v_attempt_id, 
        'remaining', CASE WHEN v_unlimited THEN -1 ELSE v_credits_before - 1 END,
        'unlimited', v_unlimited
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_essay_correction_flow TO service_role;
-- NÃO dar grant para authenticated. Esta função é interna.

-- 4. Função de finalização (Sucesso ou Erro)
CREATE OR REPLACE FUNCTION public.finalize_essay_correction(
    _attempt_id UUID,
    _status TEXT,
    _result JSONB DEFAULT NULL,
    _error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attempt RECORD;
    v_unlimited BOOLEAN;
BEGIN
    SELECT * INTO v_attempt FROM public.essay_attempts WHERE id = _attempt_id FOR UPDATE;
    
    IF v_attempt.status != 'pending' THEN
        RETURN; -- Já processado (idempotência)
    END IF;

    -- Se falhou, devolve o crédito
    IF _status = 'failed' THEN
        -- Verifica se o usuário é ilimitado (se for, não precisa devolver)
        SELECT has_full_access INTO v_unlimited FROM public.profiles WHERE id = v_attempt.user_id;
        
        IF NOT COALESCE(v_unlimited, false) THEN
            UPDATE public.profiles 
            SET credits = credits + 1 
            WHERE id = v_attempt.user_id;
        END IF;
    END IF;

    UPDATE public.essay_attempts 
    SET status = _status, 
        result = _result, 
        error_message = _error,
        updated_at = now()
    WHERE id = _attempt_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_essay_correction TO service_role;

-- 5. Revogar permissões perigosas do frontend
REVOKE EXECUTE ON FUNCTION public.consume_essay_credit() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_essay_credit() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_essay_credit() FROM public;
REVOKE EXECUTE ON FUNCTION public.refund_essay_credit() FROM public;

-- Garantir que service_role ainda pode (para uso via supabaseAdmin)
GRANT EXECUTE ON FUNCTION public.consume_essay_credit() TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_essay_credit() TO service_role;
