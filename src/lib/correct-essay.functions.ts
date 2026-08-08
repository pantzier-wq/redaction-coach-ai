import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
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
  .validator((data: unknown) => essayInputSchema.parse(data))
  .handler(async ({ data }): Promise<Correcao> => {
    // 1. Tentar obter o usuário autenticado de forma segura se houver token
    let userId: string | null = null;
    const request = getRequest();
    
    // Em TanStack Start, o request pode não ter headers se chamado de forma específica
    // mas o middleware/contexto é o lugar ideal. Aqui fazemos um check defensivo.
    const authHeader = request?.headers?.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const token = authHeader.replace("Bearer ", "");
        
        // Verifica se o token é válido e obtém o user_id
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
        }
      } catch (e) {
        console.warn("Falha ao validar token na correção (Server Side):", e);
      }
    }

    try {
      // 2. Chamar orquestrador seguro no servidor
      return await secureEssayCorrection(userId, data);
    } catch (error: any) {
      console.error("Erro em corrigirRedacao (Server Side):", error);
      
      // Mapear erros para mensagens amigáveis no frontend
      const message = error.message || "";
      
      if (message.includes("CRÉDITOS_INSUFICIENTES") || message.includes("já utilizou sua correção gratuita")) {
        throw new Error("Você não possui créditos suficientes. Adquira um plano para continuar.");
      }
      
      if (message.includes("IA retornou uma resposta fora do formato")) {
        throw new Error("A IA teve uma falha técnica na análise. Tente novamente.");
      }

      if (message.includes("Erro ao validar elegibilidade")) {
        throw new Error("Não foi possível validar seu acesso. Tente novamente.");
      }

      throw new Error("Ocorreu um erro ao processar sua redação. Por favor, tente novamente em instantes.");
    }
  });

export const analisarConectivos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => connectivesInputSchema.parse(data))
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
  .validator((data: unknown) => repertoryInputSchema.parse(data))
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
