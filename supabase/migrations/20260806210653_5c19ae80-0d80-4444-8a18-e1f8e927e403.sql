-- Garantir que payment_events tenha RLS e GRANTs corretos
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.payment_events TO service_role;
-- Sem políticas para authenticated ou anon = acesso totalmente bloqueado exceto via admin key
