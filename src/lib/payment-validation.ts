export function normalizePaymentAmountToCents(raw: string | null) {
  if (!raw) return null;

  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // Valores acima de 100 nesses produtos representam centavos no payload.
  return amount > 100 ? Math.round(amount) : Math.round(amount * 100);
}
