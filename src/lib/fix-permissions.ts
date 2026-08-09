import { supabase } from "@/integrations/supabase/client";

/**
 * Corrige as permissões das funções RPC para garantir que o service_role
 * (usado pelo servidor do TanStack Start) possa executá-las sem restrições
 * de segurança de 'anon' que poderiam causar o erro 400 Bad Request.
 */
export async function fixRpcPermissions() {
  console.log("Aplicando correção de permissões RPC...");
  
  const { error } = await supabase.rpc('execute_sql', {
    sql: `
      -- Garantir que as funções não sejam bloqueadas por políticas de execução
      GRANT EXECUTE ON FUNCTION public.check_anonymous_eligibility(uuid) TO service_role;
      GRANT EXECUTE ON FUNCTION public.create_anonymous_attempt(uuid, text, text) TO service_role;
      GRANT EXECUTE ON FUNCTION public.finalize_anonymous_attempt(uuid, jsonb) TO service_role;
      
      -- Revogar de anon/authenticated para forçar passagem pelo servidor seguro
      REVOKE EXECUTE ON FUNCTION public.check_anonymous_eligibility(uuid) FROM anon, authenticated;
      REVOKE EXECUTE ON FUNCTION public.create_anonymous_attempt(uuid, text, text) FROM anon, authenticated;
      REVOKE EXECUTE ON FUNCTION public.finalize_anonymous_attempt(uuid, jsonb) FROM anon, authenticated;
    `
  });

  if (error) {
    console.error("Erro ao aplicar permissões:", error);
  } else {
    console.log("Permissões RPC ajustadas com sucesso.");
  }
}
