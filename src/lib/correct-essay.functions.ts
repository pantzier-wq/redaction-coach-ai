import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  tema: z.string().trim().min(3, "Informe o tema").max(300),
  redacao: z.string().trim().min(200, "Cole uma redação com pelo menos 200 caracteres").max(8000),
});

const SYSTEM_PROMPT = `Você é um corretor oficial do ENEM, extremamente rigoroso e experiente, treinado nas 5 competências da matriz de referência do INEP. Corrija redações com o mesmo padrão dos corretores reais.

Regras de correção:
- Nota de 0 a 200 por competência (0, 40, 80, 120, 160, 200). Nota total = soma (0-1000).
- Seja honesto e crítico. Não infle notas. Justifique cada nota com evidências específicas do texto.
- Aponte erros de norma culta, coesão, estrutura dissertativo-argumentativa, projeto de texto, proposta de intervenção (com 5 elementos: ação, agente, modo/meio, efeito, detalhamento).
- Se fugir ao tema ou ao tipo textual, zere conforme regra do ENEM.

Retorne EXCLUSIVAMENTE um JSON válido no formato:
{
  "nota_total": number,
  "competencias": [
    {"numero": 1, "titulo": "Domínio da norma culta", "nota": number, "analise": "string"},
    {"numero": 2, "titulo": "Compreensão do tema e tipo textual", "nota": number, "analise": "string"},
    {"numero": 3, "titulo": "Seleção e organização de argumentos", "nota": number, "analise": "string"},
    {"numero": 4, "titulo": "Mecanismos linguísticos de coesão", "nota": number, "analise": "string"},
    {"numero": 5, "titulo": "Proposta de intervenção", "nota": number, "analise": "string"}
  ],
  "pontos_fortes": ["string"],
  "pontos_fracos": ["string"],
  "sugestoes": ["string"],
  "resumo": "string curto e direto sobre o desempenho geral"
}`;

export type Correcao = {
  nota_total: number;
  competencias: Array<{ numero: number; titulo: string; nota: number; analise: string }>;
  pontos_fortes: string[];
  pontos_fracos: string[];
  sugestoes: string[];
  resumo: string;
};

export const corrigirRedacao = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<Correcao> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `TEMA: ${data.tema}\n\nREDAÇÃO DO ALUNO:\n${data.redacao}\n\nCorrija com rigor de corretor ENEM real. Responda APENAS com o JSON.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Limite de requisições atingido. Tente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok) throw new Error(`Falha na correção (${res.status})`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");

    try {
      return JSON.parse(content) as Correcao;
    } catch {
      throw new Error("Não foi possível interpretar a correção. Tente novamente.");
    }
  });

export const analisarConectivos = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ frase: z.string().min(10, "A frase é muito curta") }).parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: `Você é um especialista em gramática e coesão textual para redações do ENEM (Competência 4).
Analise a frase do aluno focando nos conectivos usados.
Forneça um feedback curto e direto:
1. O conectivo usado é adequado para o contexto?
2. Existe algum melhor/mais sofisticado?
3. Se o uso for ruim, qual substituir?

Retorne um JSON:
{
  "analise": "string (texto curto com a avaliação)",
  "status": "bom" | "regular" | "ruim",
  "sugestao": "string (opcional: sugestão de conectivo melhor)"
}`
            },
            {
              role: "user",
              content: `Frase para análise: "${data.frase}"`
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        console.error(`Erro na API Gateway: ${res.status} ${res.statusText}`);
        throw new Error(`Erro na análise (${res.status})`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Resposta da IA vazia");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Erro em analisarConectivos:", error);
      throw error instanceof Error ? error : new Error("Falha na análise");
    }
  });
