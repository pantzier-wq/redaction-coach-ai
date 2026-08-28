import type { Correcao } from "@/lib/correct-essay.functions";

const allowedScore = (score: number) => {
  if (score >= 0.9) return 200;
  if (score >= 0.75) return 160;
  if (score >= 0.55) return 120;
  if (score >= 0.35) return 80;
  if (score >= 0.15) return 40;
  return 0;
};

export function buildLocalPreview(tema: string, redacao: string): Correcao {
  const text = redacao.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const firstSentence = text
    .split(/[.!?]+/)
    .find((item) => item.trim().length > 5)
    ?.trim();
  const evidence = (firstSentence || text.slice(0, 180)).replace(/\s+/g, " ").slice(0, 220);
  const hasConnectives =
    /(alem disso|além disso|entretanto|contudo|porém|portanto|desse modo)/i.test(text);
  const hasIntervention =
    /(governo|estado|escola|sociedade).{0,100}(promover|garantir|criar|implementar)/i.test(text);
  const base = [
    0.62,
    tema.trim() ? 0.6 : 0.45,
    paragraphs.length >= 3 ? 0.66 : 0.48,
    hasConnectives ? 0.7 : 0.48,
    hasIntervention ? 0.72 : 0.44,
  ];
  const titles = [
    "Domínio da norma padrão",
    "Compreensão do tema",
    "Organização dos argumentos",
    "Coesão textual",
    "Proposta de intervenção",
  ];
  const competencias = titles.map((titulo, index) => ({
    numero: index + 1,
    titulo,
    nota: allowedScore(base[index] + Math.min(words.length / 3000, 0.08)) as
      0 | 40 | 80 | 120 | 160 | 200,
    analise:
      "A pré-análise identificou um ponto que merece revisão. A correção completa apresenta o diagnóstico específico desta competência.",
    evidencia: evidence,
    como_melhorar:
      "Revise este trecho e confirme se ele cumpre claramente a função esperada na argumentação.",
  }));

  return {
    nota_total: competencias.reduce((sum, item) => sum + item.nota, 0),
    competencias,
    analise_paragrafos: [],
    pontos_fortes: [
      "Há uma intenção argumentativa identificável.",
      "O texto desenvolve o tema proposto.",
    ],
    pontos_fracos: [
      "A estrutura ainda pode ganhar mais clareza.",
      "Algumas escolhas precisam de revisão detalhada.",
    ],
    sugestoes: [
      "Confirme se a tese está explícita.",
      "Aprofunde a explicação dos argumentos.",
      "Revise a proposta de intervenção.",
    ],
    resumo:
      "Esta é uma pré-análise local. A nota e os apontamentos completos são gerados somente com uma correção disponível.",
  };
}
