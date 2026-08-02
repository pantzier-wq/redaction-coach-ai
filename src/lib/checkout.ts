/**
 * Links de checkout (Cakto).
 * Centralizados aqui para que qualquer botão de plano use a mesma fonte de verdade.
 */
export const CHECKOUT_LINKS = {
  /** Plano Essencial — R$ 19,90 (20 correções) */
  essencial: "https://pay.cakto.com.br/fmadxgn_1014212",
  /** Combo Nota 1000 — R$ 39,90 (vitalício) */
  combo: "https://pay.cakto.com.br/3cvwxof_1014273",
  /** Recarga — 5 correções por R$ 7,90 */
  credits5: "https://pay.cakto.com.br/mayyqgk_1017733",
  /** Recarga — 10 correções por R$ 9,90 */
  credits10: "https://pay.cakto.com.br/rgko447_1017734",
  /** Recarga — 20 correções por R$ 14,90 */
  credits20: "https://pay.cakto.com.br/zhohk9s_1017735",
} as const;

export type CheckoutPlan = keyof typeof CHECKOUT_LINKS;

/** Abre o checkout do plano informado. */
export function goToCheckout(plan: CheckoutPlan) {
  const url = CHECKOUT_LINKS[plan];
  if (!url) return;
  window.location.href = url;
}

/** Abre o checkout da recarga de créditos correspondente à quantidade. */
export function goToCreditsCheckout(qtd: 5 | 10 | 20 | number) {
  const map: Record<number, CheckoutPlan> = {
    5: "credits5",
    10: "credits10",
    20: "credits20",
  };
  const plan = map[qtd];
  if (!plan) return;
  goToCheckout(plan);
}

