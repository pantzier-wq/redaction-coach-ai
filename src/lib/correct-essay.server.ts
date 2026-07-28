import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";

export const essayInputSchema = z.object({
  tema: z.string().trim().min(3, "Informe o tema").max(300),
  redacao: z.string().trim().min(200, "Cole uma redação com pelo menos 200 caracteres").max(8000),
});

export const connectivesInputSchema = z.object({
  frase: z.string().trim().min(10, "A frase é muito curta"),
});

const ENEM_GRADER_SYSTEM_PROMPT = `Você é um corretor oficial do ENEM, extremamente rigoroso e experiente, treinado nas 5 competências da matriz de referência do INEP. Corrija redações com o mesmo padrão dos corretores reais.

Regras de correção:
- Nota de 0 a 200 por competência (0, 40, 80, 120, 160, 200). Nota total = soma (0-1000).
- Seja honesto e crítico. Não infle notas. Justifique cada nota com evidências específicas do texto.
- Aponte erros de norma culta, coesão, estrutura dissertativo-argumentativa, projeto de texto, proposta de intervenção (com 5 elementos: ação, agente, modo/meio, efeito, detalhamento).
- Se fugir ao tema ou ao tipo textual, zere conforme regra do ENEM.`;

const CONNECTIVES_SYSTEM_PROMPT = `Você é um especialista em gramática e coesão textual para redações do ENEM, com foco na Competência 4.

Analise apenas o conectivo usado na frase do aluno.
Responda em português do Brasil, com linguagem simples, objetiva e útil para um estudante que precisa melhorar rápido.

Critérios:
- Diga se o conectivo está adequado ao contexto.
- Se estiver fraco, repetitivo, informal ou mal aplicado, indique uma substituição melhor.
- Explique o motivo em poucas palavras, sem texto longo.
- Se não houver sugestão necessária, retorne sugestao como string vazia.
- O campo status deve ser exatamente: bom, regular ou ruim.`;

const CorrectionSchema = z.object({
  nota_total: z.number(),
  competencias: z.array(
    z.object({
      numero: z.number(),
      titulo: z.string(),
      nota: z.number(),
      analise: z.string(),
    }),
  ),
  pontos_fortes: z.array(z.string()),
  pontos_fracos: z.array(z.string()),
  sugestoes: z.array(z.string()),
  resumo: z.string(),
});

const ConnectivesAnalysisSchema = z.object({
  analise: z.string(),
  status: z.string(),
  sugestao: z.string(),
});

export type Correcao = z.infer<typeof CorrectionSchema>;
export type AnaliseConectivos = z.infer<typeof ConnectivesAnalysisSchema>;

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

function normalizeConnectivesStatus(status: string) {
  const value = status.toLowerCase().trim();
  if (value === "bom" || value === "regular" || value === "ruim") return value;
  return "regular";
}

export async function correctEssayWithAi(lovableApiKey: string, input: z.infer<typeof essayInputSchema>) {
  const gateway = createLovableAiGatewayProvider(lovableApiKey);

  try {
    const { output } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      system: ENEM_GRADER_SYSTEM_PROMPT,
      output: Output.object({ schema: CorrectionSchema }),
      prompt: `TEMA: ${input.tema}\n\nREDAÇÃO DO ALUNO:\n${input.redacao}\n\nCorrija com rigor de corretor ENEM real. Retorne apenas os campos solicitados.`,
    });

    return output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      const parsed = extractJsonObject(error.text);
      const fallback = CorrectionSchema.safeParse(parsed);
      if (fallback.success) return fallback.data;
    }

    throw error;
  }
}

export async function analyzeConnectivesWithAi(lovableApiKey: string, frase: string): Promise<AnaliseConectivos> {
  const gateway = createLovableAiGatewayProvider(lovableApiKey);

  try {
    const { output } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      system: CONNECTIVES_SYSTEM_PROMPT,
      output: Output.object({ schema: ConnectivesAnalysisSchema }),
      prompt: `Frase para análise: ${frase}`,
    });

    return {
      analise: output.analise,
      status: normalizeConnectivesStatus(output.status),
      sugestao: output.sugestao,
    };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      const parsed = ConnectivesAnalysisSchema.safeParse(extractJsonObject(error.text));
      if (parsed.success) {
        return {
          analise: parsed.data.analise,
          status: normalizeConnectivesStatus(parsed.data.status),
          sugestao: parsed.data.sugestao,
        };
      }
    }

    throw error;
  }
}