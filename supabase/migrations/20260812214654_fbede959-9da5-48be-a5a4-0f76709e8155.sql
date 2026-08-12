-- Limpa as versões duplicadas para garantir que apenas a versão correta exista
DROP FUNCTION IF EXISTS public.grant_purchase(text, text);
DROP FUNCTION IF EXISTS public.grant_purchase(text, integer);

-- Cria a versão definitiva da função de liberação de compra
CREATE OR REPLACE FUNCTION public.grant_purchase(_token text, _amount_cents integer DEFAULT NULL::integer)
 RETURNS TABLE(ok boolean, user_id uuid, plan text, note text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t RECORD;
  eff_plan text;
  expected_cents integer;
BEGIN
  -- Busca o token e trava a linha para evitar concorrência
  SELECT * INTO t FROM public.purchase_tokens WHERE token = _token FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, 'token_not_found';
    RETURN;
  END IF;

  -- Se já foi pago, apenas retorna sucesso idempotente
  IF t.status = 'paid' THEN
    RETURN QUERY SELECT true, t.user_id, t.plan, 'already_applied';
    RETURN;
  END IF;

  eff_plan := t.plan;

  -- Tabela de preços esperados (em centavos)
  -- Essencial: 1990 | Combo: 3900 | Recargas: 790, 990, 1490
  expected_cents := CASE eff_plan
    WHEN 'essencial' THEN 1990
    WHEN 'combo' THEN 3900
    WHEN 'credits5' THEN 790
    WHEN 'credits10' THEN 990
    WHEN 'credits20' THEN 1490
    ELSE 0
  END;

  -- Validação de segurança do valor pago
  -- Se o valor vier muito abaixo do esperado (mais de 1 real de diferença), bloqueia.
  -- Usamos uma margem maior (100 centavos) para acomodar taxas ou promoções pequenas da plataforma.
  IF _amount_cents IS NOT NULL AND _amount_cents > 0 AND _amount_cents < (expected_cents - 100) THEN
    RETURN QUERY SELECT false, t.user_id, eff_plan, 'invalid_amount_fraud_detected';
    RETURN;
  END IF;

  -- Aplica os benefícios do plano no perfil do usuário
  IF eff_plan = 'combo' THEN
    UPDATE public.profiles
       SET has_full_access = true, is_pro = true
     WHERE id = t.user_id;
  ELSIF eff_plan = 'essencial' THEN
    UPDATE public.profiles
       SET is_pro = true, credits = GREATEST(COALESCE(credits,0), 0) + 20
     WHERE id = t.user_id;
  ELSIF eff_plan IN ('credits5','credits10','credits20') THEN
    UPDATE public.profiles
       SET credits = COALESCE(credits,0) + CASE eff_plan
             WHEN 'credits5' THEN 5
             WHEN 'credits10' THEN 10
             ELSE 20 END
     WHERE id = t.user_id;
  ELSE
    RETURN QUERY SELECT false, t.user_id, eff_plan, 'unknown_plan';
    RETURN;
  END IF;

  -- Atualiza o status do token
  UPDATE public.purchase_tokens
     SET status = 'paid', paid_at = now()
   WHERE id = t.id;

  RETURN QUERY SELECT true, t.user_id, eff_plan, 'applied';
END;
$function$;

GRANT EXECUTE ON FUNCTION public.grant_purchase(text, integer) TO authenticated, service_role;
