-- 1. Atualizar a função grant_purchase para validar o valor (amount)
CREATE OR REPLACE FUNCTION public.grant_purchase(_token text, _amount_cents integer DEFAULT NULL)
RETURNS TABLE(ok boolean, user_id uuid, plan text, note text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t RECORD;
  eff_plan text;
  expected_cents integer;
BEGIN
  -- Busca o token e trava a linha
  SELECT * INTO t FROM public.purchase_tokens WHERE token = _token FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, 'token_not_found';
    RETURN;
  END IF;

  IF t.status = 'paid' THEN
    RETURN QUERY SELECT true, t.user_id, t.plan, 'already_applied';
    RETURN;
  END IF;

  eff_plan := t.plan;

  -- Validação de valor para evitar fraude (preços definidos no backend)
  -- 19,90 -> 1990 | 39,00 -> 3900 | 7,90 -> 790 | 9,90 -> 990 | 14,90 -> 1490
  expected_cents := CASE eff_plan
    WHEN 'essencial' THEN 1990
    WHEN 'combo' THEN 3900
    WHEN 'credits5' THEN 790
    WHEN 'credits10' THEN 990
    WHEN 'credits20' THEN 1490
    ELSE 0
  END;

  -- Se o valor pago for menor que o esperado (com margem de 1 centavo para arredondamento), rejeita
  -- Nota: _amount_cents vindo do webhook deve estar em centavos.
  IF _amount_cents IS NOT NULL AND _amount_cents < (expected_cents - 1) THEN
    RETURN QUERY SELECT false, t.user_id, eff_plan, 'invalid_amount_fraud_detected';
    RETURN;
  END IF;

  -- Aplica o plano
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

  -- Marca como pago
  UPDATE public.purchase_tokens
     SET status = 'paid', paid_at = now()
   WHERE id = t.id;

  RETURN QUERY SELECT true, t.user_id, eff_plan, 'applied';
END;
$$;

-- 2. Reforçar segurança das funções SECURITY DEFINER revogando acesso público
REVOKE EXECUTE ON FUNCTION public.grant_purchase(text, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_purchase(text, integer) TO service_role;
