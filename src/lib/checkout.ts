/**
 * Links de checkout (Cakto).
 * Centralizados aqui para que qualquer botão de plano use a mesma fonte de verdade.
 */
export const CHECKOUT_LINKS = {
  /** Plano Essencial — R$ 19,90 (20 correções) */
  essencial: "https://pay.cakto.com.br/fmadxgn_1014212",
  /** Combo Nota 1000 — R$ 39,90 (vitalício) */
  combo: "https://pay.cakto.com.br/3cvwxof_1014273",
} as const;

export type CheckoutPlan = keyof typeof CHECKOUT_LINKS;

/** Abre o checkout do plano informado. */
export function goToCheckout(plan: CheckoutPlan) {
  const url = CHECKOUT_LINKS[plan];
  if (!url) return;
  window.location.href = url;
}
