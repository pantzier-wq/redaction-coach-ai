-- 1) Column-level privileges: authenticated may only touch non-privileged columns
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, updated_at) ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2) Policy: add WITH CHECK so the row cannot be reassigned to another user
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3) Trigger: fail loudly instead of silently reverting privileged fields
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_role_name text := COALESCE(current_setting('role', true), '');
BEGIN
  IF current_role_name = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.is_pro, false) IS DISTINCT FROM COALESCE(OLD.is_pro, false)
     OR COALESCE(NEW.has_full_access, false) IS DISTINCT FROM COALESCE(OLD.has_full_access, false)
     OR COALESCE(NEW.credits, 0) IS DISTINCT FROM COALESCE(OLD.credits, 0) THEN
    RAISE EXCEPTION 'Alteração não permitida: campos de plano e créditos só podem ser modificados pelo servidor.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
