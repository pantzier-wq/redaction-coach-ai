import { createServerFn } from "@tanstack/react-start";
import {
  analyzeConnectivesWithAi,
  connectivesInputSchema,
  correctEssayWithAi,
  essayInputSchema,
  repertoryInputSchema,
  type Correcao,
  type RespostaRepertorio,
} from "@/lib/correct-essay.server";

export type { Correcao, RespostaRepertorio } from "@/lib/correct-essay.server";

export const corrigirRedacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => essayInputSchema.parse(data))
  .handler(async ({ data }): Promise<Correcao> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      console.error("LOVABLE_API_KEY não encontrada no ambiente");
      throw new Error("Erro de configuração no servidor (API Key)");
    }

    try {
      return await correctEssayWithAi(key, data);
    } catch (error: any) {
      console.error("Erro em corrigirRedacao:", error);
      throw new Error(error.message || "Erro na correção");
    }
  });

export const analisarConectivos = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => connectivesInputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    try {
      return await analyzeConnectivesWithAi(key, data.frase);
    } catch (error) {
      console.error("Erro em analisarConectivos:", error);
      throw new Error("Não foi possível analisar o conectivo agora. Tente novamente em instantes.");
    }
  });

export const criarRepertorio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => repertoryInputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    try {
      const { createRepertoryWithAi } = await import("@/lib/correct-essay.server");
      return await createRepertoryWithAi(key, data);
    } catch (error) {
      console.error("Erro em criarRepertorio:", error);
      throw new Error("Não foi possível gerar o repertório agora.");
    }
  });
