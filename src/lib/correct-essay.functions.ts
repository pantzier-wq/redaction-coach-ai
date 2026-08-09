import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import {
  essayInputSchema,
  connectivesInputSchema,
  repertoryInputSchema,
  secureEssayCorrection,
  analyzeConnectivesWithAi,
  createRepertoryWithAi,
} from "@/lib/correct-essay.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Correcao, RespostaRepertorio } from "@/lib/correct-essay.server";

export type { Correcao, RespostaRepertorio };

export const corrigirRedacao = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as z.infer<typeof essayInputSchema>)
  .handler(async ({ data }): Promise<any> => {
    let userId: string | null = null;
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
        }
      } catch (e) {
        console.warn("Falha ao validar token na correção (Server Side):", e);
      }
    }

    try {
      // Orquestrador seguro
      const result = await secureEssayCorrection(userId, data);
      return result as Correcao;
    } catch (error: any) {
      console.error("Erro em corrigirRedacao (Server Side):", error);
      
      const message = error.message || "";
      if (message.includes("CRÉDITOS_INSUFICIENTES") || message.includes("já utilizou sua correção gratuita")) {
        throw new Error("LIMITE_EXCEDIDO");
      }
      
      // Lançar erro serializável
      const detailedMessage = error instanceof Error ? error.message : String(error);
      throw error;
    }
  });

export const analisarConectivos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(connectivesInputSchema)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY!;
    return await analyzeConnectivesWithAi(key, data.frase);
  });

export const criarRepertorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(repertoryInputSchema)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY!;
    return await createRepertoryWithAi(key, data);
  });
