-- Ajustar a função handle_new_user para segurança
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Revogar permissões de execução para evitar que usuários chamem a função diretamente
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
