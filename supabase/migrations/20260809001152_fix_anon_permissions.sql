GRANT EXECUTE ON FUNCTION public.check_anonymous_eligibility(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_anonymous_attempt(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.finalize_anonymous_essay_correction(UUID, TEXT, JSONB, TEXT) TO anon;
