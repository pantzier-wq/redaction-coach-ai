/**
 * Links de checkout (Cakto).
 * Centralizados aqui para que qualquer botão de plano use a mesma fonte de verdade.
 */
export const CHECKOUT_LINKS = {
  /** Plano Essencial — R$ 19,90 (20 correções) */
  essencial: "https://pay.cakto.com.br/fmadxgn_1014212",
  /** Combo Nota 1000 — R$ 39,00 (vitalício) */
  combo: "https://pay.cakto.com.br/3cvwxof_1014273",
  /** Recarga — 5 correções por R$ 7,90 */
  credits5: "https://pay.cakto.com.br/mayyqgk_1017733",
  /** Recarga — 10 correções por R$ 9,90 */
  credits10: "https://pay.cakto.com.br/rgko447_1017734",
  /** Recarga — 20 correções por R$ 14,90 */
  credits20: "https://pay.cakto.com.br/zhohk9s_1017735",
} as const;

export type CheckoutPlan = keyof typeof CHECKOUT_LINKS;

/**
 * Abre o checkout do plano informado.
 *
 * Quando há usuário logado, geramos antes um token único de compra e o
 * enviamos ao checkout (utm_content / ref). O webhook devolve esse token e o
 * app libera o acesso na conta correta, mesmo que o e-mail do pagamento
 * seja diferente do e-mail cadastrado.
 */
export async function goToCheckout(plan: CheckoutPlan) {
  const base = CHECKOUT_LINKS[plan];
  if (!base) return;

  let url: string = base;

  try {
    const { createPurchaseToken } = await import("@/lib/purchase.functions");
    const { token, email } = await createPurchaseToken({ data: { plan } });
    const u = new URL(base);
    u.searchParams.set("utm_content", token);
    u.searchParams.set("ref", token);
    if (email) u.searchParams.set("email", email);
    url = u.toString();
  } catch {
    // Usuário não logado (ou falha ao gerar token): segue para o checkout
    // normal. Nesse caso a liberação será feita pelo e-mail do pagamento.
  }

  window.location.href = url;
}

/** Abre o checkout da recarga de créditos correspondente à quantidade. */
export async function goToCreditsCheckout(qtd: 5 | 10 | 20 | number) {
  const map: Record<number, CheckoutPlan> = {
    5: "credits5",
    10: "credits10",
    20: "credits20",
  };
  const plan = map[qtd];
  if (!plan) return;
  await goToCheckout(plan);
}
