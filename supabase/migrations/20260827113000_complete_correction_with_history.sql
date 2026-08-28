CREATE OR REPLACE FUNCTION public.complete_essay_correction_with_history(
  _attempt_id UUID,
  _tema TEXT,
  _redacao TEXT,
  _result JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_attempt public.essay_attempts%ROWTYPE;
  v_remaining INTEGER;
BEGIN
  SELECT *
    INTO v_attempt
    FROM public.essay_attempts
   WHERE id = _attempt_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'attempt_not_found');
  END IF;

  IF v_attempt.status = 'failed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'attempt_failed');
  END IF;

  IF v_attempt.status = 'pending' THEN
    UPDATE public.essay_attempts
       SET status = 'completed',
           result = _result,
           error_message = NULL,
           updated_at = now()
     WHERE id = _attempt_id;
  END IF;

  INSERT INTO public.essays (attempt_id, user_id, tema, redacao, resultado)
  VALUES (_attempt_id, v_attempt.user_id, _tema, _redacao, _result)
  ON CONFLICT (attempt_id) DO UPDATE
    SET tema = EXCLUDED.tema,
        redacao = EXCLUDED.redacao,
        resultado = EXCLUDED.resultado;

  SELECT COALESCE(credits, 0)
    INTO v_remaining
    FROM public.profiles
   WHERE id = v_attempt.user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'completed',
    'remaining', v_remaining
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_essay_correction_with_history(UUID, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_essay_correction_with_history(UUID, TEXT, TEXT, JSONB)
  TO service_role;
