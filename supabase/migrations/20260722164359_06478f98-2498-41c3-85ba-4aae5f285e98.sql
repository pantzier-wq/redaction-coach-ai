-- Tabela de perfis (relacionada ao auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_pro BOOLEAN DEFAULT FALSE,
    credits INTEGER DEFAULT 1,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Tabela de redações
CREATE TABLE public.essays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tema TEXT NOT NULL,
    redacao TEXT NOT NULL,
    resultado JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.essays TO authenticated;
GRANT ALL ON public.essays TO service_role;

ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias redações" ON public.essays
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias redações" ON public.essays
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Gatilho para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
