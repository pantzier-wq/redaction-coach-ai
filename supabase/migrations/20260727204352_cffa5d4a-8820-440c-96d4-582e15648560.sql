ALTER TABLE public.profiles ADD COLUMN has_full_access BOOLEAN DEFAULT FALSE;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;