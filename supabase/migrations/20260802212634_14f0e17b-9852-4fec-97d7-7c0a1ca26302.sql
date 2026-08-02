CREATE TABLE public.purchase_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('essencial','combo','credits5','credits10','credits20')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_tokens_user_id ON public.purchase_tokens(user_id);
CREATE INDEX idx_purchase_tokens_token ON public.purchase_tokens(token);

GRANT SELECT, INSERT ON public.purchase_tokens TO authenticated;
GRANT ALL ON public.purchase_tokens TO service_role;
ALTER TABLE public.purchase_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios tokens"
  ON public.purchase_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus próprios tokens"
  ON public.purchase_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'cakto',
  external_id text,
  token text,
  email text,
  plan text,
  status text,
  applied boolean NOT NULL DEFAULT false,
  note text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_payment_events_provider_external
  ON public.payment_events(provider, external_id) WHERE external_id IS NOT NULL;

GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.grant_purchase(_token text, _plan text DEFAULT NULL)
RETURNS TABLE(ok boolean, user_id uuid, plan text, note text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  eff_plan := COALESCE(_plan, t.plan);

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

  UPDATE public.purchase_tokens
     SET status = 'paid', paid_at = now()
   WHERE id = t.id;

  RETURN QUERY SELECT true, t.user_id, eff_plan, 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.grant_purchase(text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_purchase(text, text) TO service_role;