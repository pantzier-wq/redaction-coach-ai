-- Os dois planos passam a usar créditos de correção.
-- has_full_access continua liberando as ferramentas extras do Combo.

CREATE OR REPLACE FUNCTION public.grant_purchase(_token text, _amount_cents integer)
RETURNS TABLE(ok boolean, user_id uuid, plan text, note text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  t RECORD;
  eff_plan text;
BEGIN
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

  IF eff_plan = 'combo' THEN
    UPDATE public.profiles
       SET has_full_access = true,
           is_pro = true,
           credits = GREATEST(COALESCE(credits, 0), 0) + 25
     WHERE id = t.user_id;
  ELSIF eff_plan = 'essencial' THEN
    UPDATE public.profiles
       SET is_pro = true,
           credits = GREATEST(COALESCE(credits, 0), 0) + 12
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

  UPDATE public.purchase_tokens
     SET status = 'paid', paid_at = now()
   WHERE id = t.id;

  RETURN QUERY SELECT true, t.user_id, eff_plan, 'applied';
END;
$function$;

GRANT EXECUTE ON FUNCTION public.grant_purchase(text, integer) TO authenticated, service_role;

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
AS $function$
DECLARE
  v_profile RECORD;
  v_attempt_id UUID;
  v_credits_before INTEGER;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  v_credits_before := COALESCE(v_profile.credits, 0);

  IF NOT (COALESCE(v_profile.is_pro, false) OR COALESCE(v_profile.has_full_access, false))
     OR v_credits_before <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_credits', 'remaining', v_credits_before);
  END IF;

  IF _attempt_id IS NULL THEN
    INSERT INTO public.essay_attempts (user_id, tema, redacao_hash, status)
    VALUES (_user_id, _tema, md5(_redacao), 'pending')
    RETURNING id INTO v_attempt_id;
  ELSE
    v_attempt_id := _attempt_id;
  END IF;

  UPDATE public.profiles SET credits = credits - 1 WHERE id = _user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'attempt_id', v_attempt_id,
    'remaining', v_credits_before - 1,
    'unlimited', false
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.execute_essay_correction_flow TO service_role;

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
AS $function$
DECLARE
  v_attempt RECORD;
BEGIN
  SELECT * INTO v_attempt FROM public.essay_attempts WHERE id = _attempt_id FOR UPDATE;

  IF v_attempt.status != 'pending' THEN
    RETURN;
  END IF;

  IF _status = 'failed' THEN
    UPDATE public.profiles
       SET credits = credits + 1
     WHERE id = v_attempt.user_id;
  END IF;

  UPDATE public.essay_attempts
     SET status = _status,
         result = _result,
         error_message = _error,
         updated_at = now()
   WHERE id = _attempt_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.finalize_essay_correction TO service_role;
