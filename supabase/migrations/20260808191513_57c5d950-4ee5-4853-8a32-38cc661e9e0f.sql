-- Remover permissões anônimas explicitamente para todas as funções SD
REVOKE ALL ON FUNCTION public.protect_profile_sensitive_fields() FROM anon;
REVOKE ALL ON FUNCTION public.execute_essay_correction_flow(UUID, TEXT, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_essay_correction(UUID, TEXT, JSONB, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;

-- Garantir que não há permissão para PUBLIC (que inclui anon)
REVOKE EXECUTE ON FUNCTION public.protect_profile_sensitive_fields() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_essay_correction_flow(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_essay_correction(UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
