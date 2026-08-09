import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    try {
      const result = await secureEssayCorrection(null, data);
      return JSON.stringify(result);
    } catch (error: any) {
      console.error("ERRO NO SERVIDOR:", error);
      throw error;
    }
  });

export const analisarConectivos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY!;
    return await analyzeConnectivesWithAi(key, data.frase);
  });

export const criarRepertorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY!;
    return await createRepertoryWithAi(key, data);
  });
