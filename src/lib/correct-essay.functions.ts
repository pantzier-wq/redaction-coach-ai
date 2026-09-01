import { createServerFn } from "@tanstack/react-start";
import {
  essayInputSchema,
  connectivesInputSchema,
  repertoryInputSchema,
  essayPhotoInputSchema,
  secureEssayCorrection,
  analyzeConnectivesWithAi,
  createRepertoryWithAi,
  transcribeEssayPhotoWithAi,
} from "@/lib/correct-essay.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Correcao, CorrectionResponse, RespostaRepertorio } from "@/lib/correct-essay.server";

export type { Correcao, CorrectionResponse, RespostaRepertorio };

export const corrigirRedacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => essayInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<CorrectionResponse> => {
    try {
      return await secureEssayCorrection(context.userId, data);
    } catch (error: unknown) {
      console.error("ERRO NO HANDLER DE CORREÇÃO:", error);
      throw new Error(error instanceof Error ? error.message : "AI_TEMPORARILY_UNAVAILABLE");
    }
  });

export const analisarConectivos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => connectivesInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    return await analyzeConnectivesWithAi(context.userId, data);
  });

export const criarRepertorio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => repertoryInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    return await createRepertoryWithAi(context.userId, data);
  });

export const transcreverFotoRedacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => essayPhotoInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    return await transcribeEssayPhotoWithAi(context.userId, data);
  });
