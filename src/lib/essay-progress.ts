export interface EssayProgressRecord {
  created_at: string;
  resultado?: {
    nota_total?: number;
    competencias?: Array<{ numero: number; nota: number }>;
  };
}

export function buildEssayProgress(essays: EssayProgressRecord[]) {
  const ordered = [...essays]
    .filter((essay) => essay.resultado?.nota_total != null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (ordered.length === 0) return null;

  const scores = ordered.map((essay) => Number(essay.resultado?.nota_total) || 0);
  const first = scores[0];
  const latest = scores[scores.length - 1];
  const competencies = [1, 2, 3, 4, 5].map((number) => {
    const values = ordered
      .map((essay) =>
        essay.resultado?.competencias?.find((competency) => competency.numero === number),
      )
      .map((competency) => competency?.nota)
      .filter((score): score is number => typeof score === "number");

    return {
      nome: `C${number}`,
      media: values.length
        ? Math.round(values.reduce((total, score) => total + score, 0) / values.length)
        : 0,
    };
  });

  return {
    ordered,
    average: Math.round(scores.reduce((total, score) => total + score, 0) / scores.length),
    best: Math.max(...scores),
    latest,
    evolution: latest - first,
    competencies,
    chartData: ordered.map((essay, index) => ({
      nome: `#${index + 1}`,
      nota: Number(essay.resultado?.nota_total) || 0,
      data: new Date(essay.created_at).toLocaleDateString("pt-BR"),
    })),
  };
}
