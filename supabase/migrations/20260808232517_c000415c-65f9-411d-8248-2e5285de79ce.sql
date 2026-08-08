-- 1. Tabela para tentativas anônimas (rate limiting e controle)
CREATE TABLE IF NOT EXISTS public.anonymous_essay_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint TEXT NOT NULL, -- Identificador opaco do visitante (ex: hash de IP/UserAgent)
    tema TEXT NOT NULL,
    redacao_hash TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Visitantes não podem ler nem escrever diretamente. Apenas via Server Function (service_role).
ALTER TABLE public.anonymous_essay_attempts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.anonymous_essay_attempts TO service_role;
-- Nota: anon e authenticated não possuem GRANT nesta tabela.

-- 2. Índice para busca rápida de limite por fingerprint
CREATE INDEX IF NOT EXISTS idx_anon_attempts_fingerprint ON public.anonymous_essay_attempts(fingerprint);

-- 3. Função para validar elegibilidade gratuita (Server-Side)
CREATE OR REPLACE FUNCTION public.check_anonymous_eligibility(_fingerprint TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Conta tentativas concluídas ou pendentes recentes (últimas 24h) para este fingerprint
    SELECT count(*) INTO v_count 
    FROM public.anonymous_essay_attempts 
    WHERE fingerprint = _fingerprint 
      AND (status = 'completed' OR (status = 'pending' AND created_at > now() - interval '1 hour'));
      
    -- Permitir apenas 1 correção gratuita por fingerprint
    RETURN v_count < 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_anonymous_eligibility TO service_role;

-- 4. Funções para registrar e finalizar tentativas anônimas
CREATE OR REPLACE FUNCTION public.create_anonymous_attempt(_fingerprint TEXT, _tema TEXT, _redacao TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.anonymous_essay_attempts (fingerprint, tema, redacao_hash, status)
    VALUES (_fingerprint, _tema, md5(_redacao), 'pending')
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_anonymous_attempt TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_anonymous_essay_correction(
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
BEGIN
    UPDATE public.anonymous_essay_attempts 
    SET status = _status, 
        result = _result, 
        error_message = _error,
        updated_at = now()
    WHERE id = _attempt_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_anonymous_essay_correction TO service_role;
