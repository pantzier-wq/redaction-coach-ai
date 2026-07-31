CREATE OR REPLACE FUNCTION public.consume_essay_credit()
RETURNS TABLE(allowed boolean, unlimited boolean, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, false, 0;
    RETURN;
  END IF;

  SELECT pr.is_pro, pr.has_full_access, COALESCE(pr.credits, 0) AS credits
    INTO p
    FROM public.profiles pr
   WHERE pr.id = auth.uid()
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0;
    RETURN;
  END IF;

  IF COALESCE(p.has_full_access, false) THEN
    RETURN QUERY SELECT true, true, -1;
    RETURN;
  END IF;

  IF COALESCE(p.is_pro, false) AND p.credits > 0 THEN
    UPDATE public.profiles SET credits = p.credits - 1 WHERE id = auth.uid();
    RETURN QUERY SELECT true, false, p.credits - 1;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, false, p.credits;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_essay_credit()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.profiles
     SET credits = COALESCE(credits, 0) + 1
   WHERE id = auth.uid()
     AND COALESCE(is_pro, false) = true
     AND COALESCE(has_full_access, false) = false
  RETURNING credits INTO novo;

  RETURN COALESCE(novo, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_essay_credit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_essay_credit() TO authenticated;