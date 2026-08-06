-- Liberar o plano essencial (PRO + 20 créditos)
UPDATE public.profiles 
SET is_pro = true, credits = COALESCE(credits, 0) + 20 
WHERE id = '514c9918-9850-4ae3-bf03-d072999f1a60';

-- Marcar o token como pago
UPDATE public.purchase_tokens 
SET status = 'paid' 
WHERE token = 'ca_514c99189850_e864975f56724d60';

-- Registrar evento de auditoria
INSERT INTO public.payment_events (provider, status, applied, note, plan, token, payload)
VALUES ('manual', 'approved', true, 'liberacao_manual_por_solicitacao', 'essencial', 'ca_514c99189850_e864975f56724d60', '{"manual": true}');
