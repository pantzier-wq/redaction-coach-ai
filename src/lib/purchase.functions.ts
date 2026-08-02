import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PurchasePlan =
  | "essencial"
  | "combo"
  | "credits5"
  | "credits10"
  | "credits20";

const PLANOS: readonly PurchasePlan[] = [
  "essencial",
  "combo",
  "credits5",
  "credits10",
  "credits20",
];

/**
 * Cria (ou reaproveita) um token único de compra para o usuário logado.
 * Esse token viaja junto no link do checkout e é o que o webhook usa para
 * saber exatamente qual conta liberar após o pagamento aprovado.
 */
export const createPurchaseToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: PurchasePlan }) => {
    if (!input || !PLANOS.includes(input.plan)) {
      throw new Error("Plano inválido");
    }
    return { plan: input.plan };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const token = `ca_${userId.replace(/-/g, "").slice(0, 12)}_${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 16)}`;

    const { error } = await supabase
      .from("purchase_tokens")
      .insert({ token, user_id: userId, plan: data.plan });

    if (error) throw new Error(error.message);

    const email =
      typeof claims?.["email"] === "string" ? (claims["email"] as string) : null;

    return { token, email };
  });
