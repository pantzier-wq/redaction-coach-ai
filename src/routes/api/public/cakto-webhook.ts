import { createFileRoute } from "@tanstack/react-router";
import { normalizePaymentAmountToCents } from "@/lib/payment-validation";

/**
 * Webhook público de pagamento (Cakto).
 *
 * URL para configurar no provedor:
 *   https://<seu-dominio>/api/public/cakto-webhook?secret=SEU_SEGREDO
 *
 * Segurança: exige o segredo (header `x-webhook-secret` OU query `?secret=`)
 * comparado em tempo constante. Sem segredo válido → 401.
 *
 * Como funciona a liberação:
 *  1) procura no payload o token de compra gerado pelo app (sck/ref);
 *  2) se achar, chama `grant_purchase` que libera o plano correto e marca o
 *     token como pago (idempotente);
 *  3) se não achar token, tenta casar pelo e-mail do comprador;
 *  4) todo evento recebido é gravado em `payment_events` para auditoria.
 */

type Json = Record<string, unknown>;

const APPROVED = [
  "paid",
  "approved",
  "purchase_approved",
  "payment_approved",
  "complete",
  "completed",
  "aprovado",
  "pago",
];

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Busca recursiva por chaves conhecidas dentro de um payload desconhecido. */
function findValue(obj: unknown, keys: string[], depth = 0): string | null {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  const entries = Array.isArray(obj)
    ? obj.map((v, i) => [String(i), v] as const)
    : Object.entries(obj as Json);

  for (const [k, v] of entries) {
    if (keys.includes(k.toLowerCase()) && (typeof v === "string" || typeof v === "number")) {
      const s = String(v).trim();
      if (s) return s;
    }
  }
  for (const [, v] of entries) {
    const found = findValue(v, keys, depth + 1);
    if (found) return found;
  }
  return null;
}

/** Procura em todo o payload uma string com o formato do nosso token (ca_...). */
function findToken(payload: unknown): string | null {
  const direct = findValue(payload, [
    "sck",
    "ref",
    "reference",
    "custom_id",
    "token",
    "metadata",
    "external_id",
    "client_reference_id",
  ]);
  if (direct?.startsWith("ca_")) return direct;
  const raw = JSON.stringify(payload ?? {});
  const match = raw.match(/ca_[a-z0-9]{6,}_[a-z0-9]{6,}/i);
  return match ? match[0] : direct;
}

export const Route = createFileRoute("/api/public/cakto-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["CAKTO_WEBHOOK_SECRET"];
        if (!expected) {
          return new Response("Webhook não configurado", { status: 503 });
        }

        const url = new URL(request.url);
        const provided =
          request.headers.get("x-webhook-secret") ??
          request.headers.get("x-cakto-secret") ??
          url.searchParams.get("secret") ??
          "";

        // Se o segredo começa com "https:", o usuário provavelmente configurou a URL inteira como segredo.
        // Vamos extrair o parâmetro secret da URL se for o caso.
        let finalExpected = expected;
        if (expected.startsWith("http")) {
          try {
            const expUrl = new URL(expected);
            const secretParam = expUrl.searchParams.get("secret");
            if (secretParam) {
              finalExpected = secretParam;
            }
          } catch (e) {
            // Não é uma URL válida, mantém o original
          }
        }

        if (!timingSafeEqual(provided, finalExpected)) {
          return new Response(`Unauthorized: mismatch`, { status: 401 });
        }

        if (request.method !== "POST") {
          return new Response("Method Not Allowed", { status: 405 });
        }

        const body = await request.text();
        if (!body || body.trim() === "") {
          console.error("[Cakto Webhook] Empty body received");
          return new Response("Empty Body", { status: 400 });
        }

        let payload: unknown;
        try {
          payload = JSON.parse(body);
        } catch (e: any) {
          console.error("[Cakto Webhook] JSON Parse Error:", e.message);
          // Tenta sanitizar caso venha com caracteres estranhos (BOM, etc)
          try {
            const sanitized = body.replace(/^\uFEFF/, "").trim();
            payload = JSON.parse(sanitized);
          } catch (e2) {
            return new Response("Invalid JSON", { status: 400 });
          }
        }

        const status = (
          findValue(payload, ["status", "event", "event_type", "type"]) ?? ""
        ).toLowerCase();
        const email = findValue(payload, ["email", "customer_email", "buyer_email"]);
        const externalId = findValue(payload, ["id", "transaction_id", "order_id", "checkout_id"]);
        const amountRaw = findValue(payload, [
          "amount",
          "amount_cents",
          "amount_in_cents",
          "value",
          "price",
          "total",
        ]);
        const amountCents = normalizePaymentAmountToCents(amountRaw);
        const token = findToken(payload);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const isApproved = APPROVED.some((s) => status.includes(s));
        let applied = false;
        let note = isApproved ? "sem_token_e_sem_email" : `ignorado_status:${status || "vazio"}`;
        let plan: string | null = null;

        if (isApproved && token) {
          const { data, error } = await supabaseAdmin.rpc("grant_purchase", {
            _token: token,
            _amount_cents: amountCents,
          });
          const row = Array.isArray(data) ? data[0] : data;
          if (error) {
            note = `erro_rpc:${error.message}`;
          } else if (row?.ok) {
            applied = row.note === "applied";
            plan = row.plan ?? null;
            note = row.note ?? "applied";
          } else {
            note = row?.note ?? "token_invalido";
          }
        } else if (isApproved && email) {
          // Fallback: sem token, tenta o token pendente mais recente do e-mail.
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const user = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (user) {
            const { data: pend } = await supabaseAdmin
              .from("purchase_tokens")
              .select("token")
              .eq("user_id", user.id)
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(1);
            const pendingToken = pend?.[0]?.token;
            if (pendingToken) {
              const { data } = await supabaseAdmin.rpc("grant_purchase", {
                _token: pendingToken,
                _amount_cents: amountCents,
              });
              const row = Array.isArray(data) ? data[0] : data;
              applied = row?.note === "applied";
              plan = row?.plan ?? null;
              note = `por_email:${row?.note ?? "falhou"}`;
            } else {
              note = "email_sem_token_pendente";
            }
          } else {
            note = "email_sem_conta";
          }
        }

        // Mascarar dados sensíveis no payload antes de logar
        const safePayload = JSON.parse(JSON.stringify(payload));
        if (safePayload.customer) {
          if (safePayload.customer.email) safePayload.customer.email = "***@***.com";
          if (safePayload.customer.phone) safePayload.customer.phone = "********";
          if (safePayload.customer.cpf) safePayload.customer.cpf = "***********";
        }

        await supabaseAdmin.from("payment_events").insert({
          provider: "cakto",
          external_id: externalId,
          token,
          email: email ? `${email.split("@")[0].slice(0, 3)}...@${email.split("@")[1]}` : null,
          plan,
          status,
          applied,
          note,
          payload: safePayload as never,
        });

        // Sempre 200 para o provedor não reenviar infinitamente.
        return Response.json({ received: true, applied, note });
      },
    },
  },
});
