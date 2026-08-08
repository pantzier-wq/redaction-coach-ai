import { createServerFn } from "@tanstack/react-start";
import {
  analyzeConnectivesWithAi,
  connectivesInputSchema,
  essayInputSchema,
  repertoryInputSchema,
  secureEssayCorrection,
  type Correcao,
  type RespostaRepertorio,
} from "@/lib/correct-essay.server";

export type { Correcao, RespostaRepertorio } from "@/lib/correct-essay.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const corrigirRedacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => essayInputSchema.parse(data))
  .handler(async ({ data, request }): Promise<Correcao> => {
    // 1. Tentar obter o usuário autenticado de forma segura se houver token
    let userId: string | null = null;
    const authHeader = request.headers.get("authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        userId = user?.id || null;
      } catch (e) {
        console.warn("Falha ao validar token na correção:", e);
      }
    }

    try {
      // 2. Chamar orquestrador seguro no servidor
      return await secureEssayCorrection(userId, data);
    } catch (error: any) {
      console.error("Erro em corrigirRedacao:", error);
      throw new Error(error.message || "Erro na correção");
    }
  });

export const analisarConectivos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => connectivesInputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      console.error("LOVABLE_API_KEY não encontrada no ambiente");
      throw new Error("Erro de configuração no servidor (API Key)");
    }

    try {
      return await analyzeConnectivesWithAi(key, data.frase);
    } catch (error: any) {
      console.error("Erro em analisarConectivos:", error);
      throw new Error(error.message || "Erro na análise de conectivos");
    }
  });

export const criarRepertorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => repertoryInputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      console.error("LOVABLE_API_KEY não encontrada no ambiente");
      throw new Error("Erro de configuração no servidor (API Key)");
    }

    try {
      const { createRepertoryWithAi } = await import("@/lib/correct-essay.server");
      return await createRepertoryWithAi(key, data);
    } catch (error: any) {
      console.error("Erro em criarRepertorio:", error);
      throw new Error(error.message || "Erro ao gerar repertório");
    }
  });
