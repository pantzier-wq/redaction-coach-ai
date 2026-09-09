-- Toda conta nova recebe uma única correção gratuita.
-- O consumo continua transacional e protegido pela função server-side.

ALTER TABLE public.profiles
  ALTER COLUMN credits SET DEFAULT 1;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    is_pro,
    credits,
    full_name,
    avatar_url,
    has_full_access
  )
  VALUES (
    NEW.id,
    false,
    1,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

CREATE OR REPLACE FUNCTION public.start_essay_correction(
  _user_id UUID,
  _request_id UUID,
  _tema TEXT,
  _redacao_hash TEXT,
  _model TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_existing public.essay_attempts%ROWTYPE;
  v_pending public.essay_attempts%ROWTYPE;
  v_attempt_id UUID;
  v_remaining INTEGER;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AUTH_REQUIRED');
  END IF;

  SELECT * INTO v_existing
    FROM public.essay_attempts
   WHERE user_id = _user_id AND request_id = _request_id
   FOR UPDATE;

  IF FOUND THEN
    IF v_existing.status = 'completed' THEN
      RETURN jsonb_build_object(
        'ok', true,
        'replayed', true,
        'attempt_id', v_existing.id,
        'result', v_existing.result,
        'remaining', COALESCE(v_profile.credits, 0)
      );
    END IF;
    IF v_existing.status = 'pending' THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'REQUEST_IN_PROGRESS',
        'attempt_id', v_existing.id
      );
    END IF;
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'AI_TEMPORARILY_UNAVAILABLE',
      'attempt_id', v_existing.id
    );
  END IF;

  SELECT * INTO v_pending
    FROM public.essay_attempts
   WHERE user_id = _user_id AND status = 'pending'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND AND v_pending.updated_at >= now() - interval '5 minutes' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'REQUEST_IN_PROGRESS',
      'attempt_id', v_pending.id
    );
  ELSIF FOUND THEN
    IF NOT v_pending.credit_refunded THEN
      UPDATE public.profiles
         SET credits = COALESCE(credits, 0) + 1
       WHERE id = _user_id;
      UPDATE public.essay_attempts
         SET status = 'failed',
             credit_refunded = true,
             error_message = 'stale_attempt',
             updated_at = now()
       WHERE id = v_pending.id;
      v_profile.credits := COALESCE(v_profile.credits, 0) + 1;
    END IF;
  END IF;

  IF COALESCE(v_profile.credits, 0) <= 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'INSUFFICIENT_CREDITS',
      'remaining', COALESCE(v_profile.credits, 0)
    );
  END IF;

  INSERT INTO public.essay_attempts (
    user_id,
    request_id,
    tema,
    redacao_hash,
    status,
    model
  )
  VALUES (
    _user_id,
    _request_id,
    _tema,
    _redacao_hash,
    'pending',
    _model
  )
  RETURNING id INTO v_attempt_id;

  UPDATE public.profiles
     SET credits = COALESCE(credits, 0) - 1
   WHERE id = _user_id
   RETURNING credits INTO v_remaining;

  RETURN jsonb_build_object(
    'ok', true,
    'replayed', false,
    'attempt_id', v_attempt_id,
    'remaining', v_remaining
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.start_essay_correction(UUID, UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_essay_correction(UUID, UUID, TEXT, TEXT, TEXT)
  TO service_role;
