-- 1. Refinar RLS em purchase_tokens
DROP POLICY IF EXISTS "Usuários veem seus próprios tokens" ON public.purchase_tokens;
CREATE POLICY "Usuários veem seus próprios tokens"
  ON public.purchase_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Refinar RLS em essays
DROP POLICY IF EXISTS "Usuários podem ver suas próprias redações" ON public.essays;
CREATE POLICY "Usuários podem ver suas próprias redações"
  ON public.essays FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Proteger campos sensíveis no profiles via trigger
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    NEW.is_pro := OLD.is_pro;
    NEW.credits := OLD.credits;
    NEW.has_full_access := OLD.has_full_access;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- 4. Revogar acesso direto às funções de crédito (assinaturas sem argumentos conforme types.ts)
REVOKE ALL ON FUNCTION public.consume_essay_credit() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.refund_essay_credit() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.consume_essay_credit() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_essay_credit() TO service_role, authenticated;
