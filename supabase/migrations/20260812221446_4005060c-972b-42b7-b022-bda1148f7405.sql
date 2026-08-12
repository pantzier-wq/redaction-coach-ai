CREATE OR REPLACE FUNCTION public.grant_purchase(_token text, _amount_cents integer DEFAULT NULL::integer)
 RETURNS TABLE(ok boolean, user_id uuid, plan text, note text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  t RECORD;
  eff_plan text;
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

  -- APLICAR BENEFÍCIOS
  IF eff_plan = 'combo' THEN
    UPDATE public.profiles
       SET has_full_access = true, is_pro = true
     WHERE id = t.user_id;
  ELSIF eff_plan = 'essencial' THEN
    UPDATE public.profiles
       SET is_pro = true, credits = GREATEST(COALESCE(credits, 0), 0) + 20
     WHERE id = t.user_id;
  ELSIF eff_plan IN ('credits5','credits10','credits20') THEN
    UPDATE public.profiles
       SET credits = COALESCE(credits, 0) + CASE eff_plan
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
$$;