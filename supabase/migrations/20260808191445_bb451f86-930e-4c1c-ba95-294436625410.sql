-- Revogar EXECUTE para public e authenticated em todas as funções sensíveis
-- A função protect_profile_sensitive_fields agora é SD com search_path, então revogamos acesso direto
REVOKE EXECUTE ON FUNCTION public.protect_profile_sensitive_fields() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_sensitive_fields() FROM authenticated;

-- Garantir que consume/refund/grant estão bloqueadas para usuários (já feito, mas reforçando)
REVOKE EXECUTE ON FUNCTION public.consume_essay_credit() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_essay_credit() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.refund_essay_credit() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_essay_credit() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.grant_purchase(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_purchase(text, integer) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.grant_purchase(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_purchase(text, text) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.execute_essay_correction_flow(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_essay_correction_flow(UUID, TEXT, TEXT, UUID) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.finalize_essay_correction(UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_essay_correction(UUID, TEXT, JSONB, TEXT) FROM authenticated;

-- Somente service_role (backend) pode executar
GRANT EXECUTE ON FUNCTION public.consume_essay_credit() TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_essay_credit() TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_purchase(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_purchase(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_essay_correction_flow(UUID, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_essay_correction(UUID, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.protect_profile_sensitive_fields() TO service_role;
