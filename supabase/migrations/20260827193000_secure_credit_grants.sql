-- Somente o webhook, usando service_role, pode conceder planos ou creditos.
-- O valor aprovado tambem precisa cobrir o preco configurado para o produto.

CREATE OR REPLACE FUNCTION public.grant_purchase(
  _token TEXT,
  _amount_cents INTEGER
)
RETURNS TABLE(ok BOOLEAN, user_id UUID, plan TEXT, note TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_purchase public.purchase_tokens%ROWTYPE;
  v_expected_cents INTEGER;
BEGIN
  SELECT *
    INTO v_purchase
    FROM public.purchase_tokens
   WHERE token = _token
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'token_not_found';
    RETURN;
  END IF;

  IF v_purchase.status = 'paid' THEN
    RETURN QUERY SELECT true, v_purchase.user_id, v_purchase.plan, 'already_applied';
    RETURN;
  END IF;

  v_expected_cents := CASE v_purchase.plan
    WHEN 'essencial' THEN 1990
    WHEN 'combo' THEN 3900
    WHEN 'credits5' THEN 790
    WHEN 'credits10' THEN 990
    WHEN 'credits20' THEN 1490
    ELSE NULL
  END;

  IF v_expected_cents IS NULL THEN
    RETURN QUERY SELECT false, v_purchase.user_id, v_purchase.plan, 'unknown_plan';
    RETURN;
  END IF;

  IF _amount_cents IS NULL OR _amount_cents < v_expected_cents THEN
    RETURN QUERY SELECT false, v_purchase.user_id, v_purchase.plan, 'invalid_amount';
    RETURN;
  END IF;

  IF v_purchase.plan = 'combo' THEN
    UPDATE public.profiles
       SET has_full_access = true,
           is_pro = true,
           credits = GREATEST(COALESCE(credits, 0), 0) + 25
     WHERE id = v_purchase.user_id;
  ELSIF v_purchase.plan = 'essencial' THEN
    UPDATE public.profiles
       SET is_pro = true,
           credits = GREATEST(COALESCE(credits, 0), 0) + 12
     WHERE id = v_purchase.user_id;
  ELSE
    UPDATE public.profiles
       SET credits = GREATEST(COALESCE(credits, 0), 0) + CASE v_purchase.plan
             WHEN 'credits5' THEN 5
             WHEN 'credits10' THEN 10
             ELSE 20
           END
     WHERE id = v_purchase.user_id;
  END IF;

  UPDATE public.purchase_tokens
     SET status = 'paid', paid_at = now()
   WHERE id = v_purchase.id;

  RETURN QUERY SELECT true, v_purchase.user_id, v_purchase.plan, 'applied';
END;
$function$;

REVOKE ALL ON FUNCTION public.grant_purchase(TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_purchase(TEXT, INTEGER)
  TO service_role;
