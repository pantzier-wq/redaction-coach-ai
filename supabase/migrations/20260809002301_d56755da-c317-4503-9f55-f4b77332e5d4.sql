-- Revogar permissões públicas para as funções de correção anônima (serão chamadas apenas via service_role no servidor)
REVOKE EXECUTE ON FUNCTION public.check_anonymous_eligibility(TEXT) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_anonymous_attempt(TEXT, TEXT, TEXT) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finalize_anonymous_essay_correction(UUID, TEXT, JSONB, TEXT) FROM public, anon, authenticated;

-- Garantir acesso apenas para service_role
GRANT EXECUTE ON FUNCTION public.check_anonymous_eligibility(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_anonymous_attempt(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_anonymous_essay_correction(UUID, TEXT, JSONB, TEXT) TO service_role;
