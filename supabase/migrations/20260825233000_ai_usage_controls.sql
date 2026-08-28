-- Controles de custo, idempotencia e uso justo para as ferramentas de IA.

ALTER TABLE public.essay_attempts
  ADD COLUMN IF NOT EXISTS request_id UUID,
  ADD COLUMN IF NOT EXISTS credit_refunded BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS model TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_essay_attempts_user_request
  ON public.essay_attempts(user_id, request_id)
  WHERE request_id IS NOT NULL;

ALTER TABLE public.essays
  ADD COLUMN IF NOT EXISTS attempt_id UUID REFERENCES public.essay_attempts(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_essays_attempt_id
  ON public.essays(attempt_id)
  WHERE attempt_id IS NOT NULL;

-- Resultados pagos so podem ser criados pelo servidor. As permissoes antigas
-- permitiam fabricar tentativas concluidas e historicos pelo cliente.
DROP POLICY IF EXISTS "Usuários inserem suas próprias tentativas" ON public.essay_attempts;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias redações" ON public.essays;
REVOKE INSERT, UPDATE, DELETE ON public.essay_attempts FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE ON public.essays FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.essay_attempts, public.essays TO authenticated;
GRANT ALL ON public.essay_attempts, public.essays TO service_role;

CREATE TABLE IF NOT EXISTS public.ai_tool_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL CHECK (tool IN ('connectives', 'repertory')),
  usage_date DATE NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 1 CHECK (call_count BETWEEN 1 AND 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_tool_sessions_daily
  ON public.ai_tool_sessions(user_id, tool, usage_date);

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL CHECK (feature IN ('essay_correction', 'connectives', 'repertory')),
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'completed', 'failed', 'cancelled')),
  estimated_microusd BIGINT NOT NULL DEFAULT 0 CHECK (estimated_microusd >= 0),
  actual_microusd BIGINT CHECK (actual_microusd >= 0),
  input_tokens INTEGER CHECK (input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens >= 0),
  latency_ms INTEGER CHECK (latency_ms >= 0),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_daily
  ON public.ai_usage_events(created_at, status);

ALTER TABLE public.ai_tool_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_tool_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.ai_usage_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_tool_sessions TO service_role;
GRANT ALL ON public.ai_usage_events TO service_role;

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
      RETURN jsonb_build_object('ok', false, 'error', 'REQUEST_IN_PROGRESS', 'attempt_id', v_existing.id);
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'AI_TEMPORARILY_UNAVAILABLE', 'attempt_id', v_existing.id);
  END IF;

  SELECT * INTO v_pending
    FROM public.essay_attempts
   WHERE user_id = _user_id AND status = 'pending'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND AND v_pending.updated_at >= now() - interval '5 minutes' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'REQUEST_IN_PROGRESS', 'attempt_id', v_pending.id);
  ELSIF FOUND THEN
    IF NOT v_pending.credit_refunded THEN
      UPDATE public.profiles SET credits = COALESCE(credits, 0) + 1 WHERE id = _user_id;
      UPDATE public.essay_attempts
         SET status = 'failed', credit_refunded = true,
             error_message = 'stale_attempt', updated_at = now()
       WHERE id = v_pending.id;
      v_profile.credits := COALESCE(v_profile.credits, 0) + 1;
    END IF;
  END IF;

  IF NOT (COALESCE(v_profile.is_pro, false) OR COALESCE(v_profile.has_full_access, false))
     OR COALESCE(v_profile.credits, 0) <= 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'INSUFFICIENT_CREDITS',
      'remaining', COALESCE(v_profile.credits, 0)
    );
  END IF;

  INSERT INTO public.essay_attempts (
    user_id, request_id, tema, redacao_hash, status, model
  ) VALUES (
    _user_id, _request_id, _tema, _redacao_hash, 'pending', _model
  ) RETURNING id INTO v_attempt_id;

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

CREATE OR REPLACE FUNCTION public.finish_essay_correction(
  _attempt_id UUID,
  _status TEXT,
  _result JSONB DEFAULT NULL,
  _error TEXT DEFAULT NULL
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
  IF _status NOT IN ('completed', 'failed') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  SELECT * INTO v_attempt FROM public.essay_attempts WHERE id = _attempt_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'attempt_not_found');
  END IF;

  IF v_attempt.status != 'pending' THEN
    SELECT COALESCE(credits, 0) INTO v_remaining FROM public.profiles WHERE id = v_attempt.user_id;
    RETURN jsonb_build_object(
      'ok', v_attempt.status = 'completed',
      'status', v_attempt.status,
      'remaining', v_remaining,
      'result', v_attempt.result
    );
  END IF;

  IF _status = 'failed' AND NOT v_attempt.credit_refunded THEN
    UPDATE public.profiles
       SET credits = COALESCE(credits, 0) + 1
     WHERE id = v_attempt.user_id
     RETURNING credits INTO v_remaining;
  ELSE
    SELECT COALESCE(credits, 0) INTO v_remaining FROM public.profiles WHERE id = v_attempt.user_id;
  END IF;

  UPDATE public.essay_attempts
     SET status = _status,
         result = _result,
         error_message = _error,
         credit_refunded = (_status = 'failed'),
         updated_at = now()
   WHERE id = _attempt_id;

  RETURN jsonb_build_object('ok', _status = 'completed', 'status', _status, 'remaining', v_remaining);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_ai_tool_usage(
  _user_id UUID,
  _tool TEXT,
  _session_id UUID,
  _daily_limit INTEGER,
  _max_calls INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_session public.ai_tool_sessions%ROWTYPE;
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_used INTEGER;
BEGIN
  IF _tool NOT IN ('connectives', 'repertory') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_tool');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND OR NOT COALESCE(v_profile.has_full_access, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AUTH_REQUIRED');
  END IF;

  SELECT * INTO v_session FROM public.ai_tool_sessions WHERE id = _session_id FOR UPDATE;
  IF FOUND THEN
    IF v_session.user_id != _user_id OR v_session.tool != _tool THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_session');
    END IF;
    IF v_session.created_at < now() - interval '1 hour' OR v_session.call_count >= _max_calls THEN
      RETURN jsonb_build_object('ok', false, 'error', 'TOOL_LIMIT_REACHED');
    END IF;
    UPDATE public.ai_tool_sessions
       SET call_count = call_count + 1, updated_at = now()
     WHERE id = _session_id
     RETURNING * INTO v_session;
  ELSE
    SELECT COUNT(*)::INTEGER INTO v_used
      FROM public.ai_tool_sessions
     WHERE user_id = _user_id AND tool = _tool AND usage_date = v_today;
    IF v_used >= _daily_limit THEN
      RETURN jsonb_build_object('ok', false, 'error', 'TOOL_LIMIT_REACHED', 'remaining', 0);
    END IF;
    INSERT INTO public.ai_tool_sessions(id, user_id, tool, usage_date)
      VALUES (_session_id, _user_id, _tool, v_today)
      RETURNING * INTO v_session;
    v_used := v_used + 1;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_used
    FROM public.ai_tool_sessions
   WHERE user_id = _user_id AND tool = _tool AND usage_date = v_today;

  RETURN jsonb_build_object(
    'ok', true,
    'remaining', GREATEST(_daily_limit - v_used, 0),
    'session_calls_remaining', GREATEST(_max_calls - v_session.call_count, 0)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_ai_budget(
  _user_id UUID,
  _feature TEXT,
  _model TEXT,
  _estimated_microusd BIGINT,
  _daily_limit_microusd BIGINT,
  _priority BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_spent BIGINT;
  v_event_id UUID;
  v_feature_limit BIGINT;
BEGIN
  PERFORM pg_advisory_xact_lock(2147483001);

  SELECT COALESCE(SUM(COALESCE(actual_microusd, estimated_microusd)), 0)::BIGINT
    INTO v_spent
    FROM public.ai_usage_events
   WHERE status IN ('reserved', 'completed', 'failed')
     AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date =
         (now() AT TIME ZONE 'America/Sao_Paulo')::date;

  v_feature_limit := CASE
    WHEN _priority THEN _daily_limit_microusd
    ELSE FLOOR(_daily_limit_microusd * 0.8)::BIGINT
  END;

  IF v_spent + _estimated_microusd > v_feature_limit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AI_DAILY_BUDGET_EXCEEDED');
  END IF;

  INSERT INTO public.ai_usage_events(user_id, feature, model, estimated_microusd)
    VALUES (_user_id, _feature, _model, _estimated_microusd)
    RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('ok', true, 'event_id', v_event_id, 'reserved_microusd', v_spent + _estimated_microusd);
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_ai_tool_usage(
  _user_id UUID,
  _session_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_session public.ai_tool_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session
    FROM public.ai_tool_sessions
   WHERE id = _session_id AND user_id = _user_id
   FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_session.call_count <= 1 THEN
    DELETE FROM public.ai_tool_sessions WHERE id = _session_id;
  ELSE
    UPDATE public.ai_tool_sessions
       SET call_count = call_count - 1, updated_at = now()
     WHERE id = _session_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.finish_ai_usage(
  _event_id UUID,
  _status TEXT,
  _actual_microusd BIGINT DEFAULT NULL,
  _input_tokens INTEGER DEFAULT NULL,
  _output_tokens INTEGER DEFAULT NULL,
  _latency_ms INTEGER DEFAULT NULL,
  _error_code TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  UPDATE public.ai_usage_events
     SET status = _status,
         actual_microusd = _actual_microusd,
         input_tokens = _input_tokens,
         output_tokens = _output_tokens,
         latency_ms = _latency_ms,
         error_code = _error_code,
         updated_at = now()
   WHERE id = _event_id AND status = 'reserved';
$function$;

REVOKE ALL ON FUNCTION public.start_essay_correction(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_essay_correction(UUID, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_ai_tool_usage(UUID, TEXT, UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_ai_budget(UUID, TEXT, TEXT, BIGINT, BIGINT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_ai_tool_usage(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_ai_usage(UUID, TEXT, BIGINT, INTEGER, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.start_essay_correction(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_essay_correction(UUID, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_ai_tool_usage(UUID, TEXT, UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_ai_budget(UUID, TEXT, TEXT, BIGINT, BIGINT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_tool_usage(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_ai_usage(UUID, TEXT, BIGINT, INTEGER, INTEGER, INTEGER, TEXT) TO service_role;
