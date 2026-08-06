-- 1. Configurar search_path para segurança (usando as assinaturas corretas)
-- Nota: PostgreSQL diferencia o nome dos tipos (int vs integer) em chamadas de função
ALTER FUNCTION public.grant_purchase(text, integer) SET search_path = public;
ALTER FUNCTION public.consume_essay_credit() SET search_path = public;
ALTER FUNCTION public.refund_essay_credit() SET search_path = public;

-- 2. Restringir grant_purchase apenas para service_role
REVOKE ALL ON FUNCTION public.grant_purchase(text, integer) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.grant_purchase(text, integer) TO service_role;

-- 3. Política explícita de negação para logs de pagamento
DROP POLICY IF EXISTS "Ninguém pode ler logs de pagamento" ON public.payment_events;
CREATE POLICY "Ninguém pode ler logs de pagamento" 
  ON public.payment_events FOR ALL TO public USING (false);
