-- 1. Fortalecer permissões na tabela profiles
-- Revogar permissões amplas e garantir que o usuário só possa atualizar campos não-sensíveis
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
-- Permitimos que o usuário atualize apenas full_name e avatar_url
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

-- 2. Garantir que as tabelas de controle não sejam acessíveis por usuários authenticated em massa
REVOKE ALL ON public.purchase_tokens FROM authenticated;
GRANT SELECT, INSERT ON public.purchase_tokens TO authenticated;

-- 3. Payment Events deve ser estritamente privado (service_role only)
REVOKE ALL ON public.payment_events FROM authenticated;
REVOKE ALL ON public.payment_events FROM anon;
GRANT ALL ON public.payment_events TO service_role;

-- 4. Melhorar RLS em essays para garantir que user_id não seja forjado
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias redações" ON public.essays;
CREATE POLICY "Usuários podem inserir suas próprias redações" ON public.essays
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. Criar índices para performance em consultas frequentes
CREATE INDEX IF NOT EXISTS idx_essays_user_id_created_at ON public.essays(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON public.profiles(is_pro) WHERE is_pro = true;
