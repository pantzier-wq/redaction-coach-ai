-- 1. Proteção contra alteração manual de campos sensíveis via UPDATE
-- Criar ou substituir a função de proteção
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Se não for service_role, impede alteração de campos de cobrança/status
  IF (current_setting('role') != 'service_role') THEN
    NEW.is_pro := OLD.is_pro;
    NEW.credits := OLD.credits;
    NEW.has_full_access := OLD.has_full_access;
  END IF;
  RETURN NEW;
END;
$function$;

-- Garantir que o trigger existe e está ativo
DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION protect_profile_sensitive_fields();

-- 2. Corrigir search_path em funções SECURITY DEFINER existentes (boas práticas de segurança)
ALTER FUNCTION public.consume_essay_credit() SET search_path = public;
ALTER FUNCTION public.refund_essay_credit() SET search_path = public;
ALTER FUNCTION public.grant_purchase(text, integer) SET search_path = public;
ALTER FUNCTION public.grant_purchase(text, text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
