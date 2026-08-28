import { describe, expect, it } from "vitest";
import { repertories, findRepertoryCandidates } from "@/data/repertories";
import { buildLocalPreview } from "@/lib/local-preview";
import { CorrectionSchema } from "@/lib/correct-essay.server";
import { normalizePaymentAmountToCents } from "@/lib/payment-validation";

const essay = `A desigualdade educacional ainda afeta muitos estudantes brasileiros. Esse problema limita oportunidades e amplia diferencas sociais.

Além disso, a falta de infraestrutura dificulta o aprendizado. Escolas sem recursos não conseguem garantir condições adequadas.

Portanto, o Estado deve criar programas de investimento e fiscalização, a fim de ampliar o acesso a uma educação de qualidade.`;

describe("biblioteca de repertorios", () => {
  it("entrega pelo menos 70 referencias com ids unicos", () => {
    expect(repertories.length).toBeGreaterThanOrEqual(70);
    expect(new Set(repertories.map((item) => item.id)).size).toBe(repertories.length);
  });

  it("prioriza referencias relacionadas ao tema", () => {
    const candidates = findRepertoryCandidates("desigualdade na educacao brasileira");
    expect(candidates).toHaveLength(6);
    expect(candidates.some((item) => item.eixosTematicos.includes("educacao"))).toBe(true);
  });
});

describe("contrato da correcao", () => {
  it("gera previa local valida sem nota fora da matriz", () => {
    const preview = buildLocalPreview("Desigualdade educacional", essay);
    expect(CorrectionSchema.parse(preview)).toEqual(preview);
    expect(preview.nota_total).toBe(preview.competencias.reduce((sum, item) => sum + item.nota, 0));
    expect(
      preview.competencias.every((item) => [0, 40, 80, 120, 160, 200].includes(item.nota)),
    ).toBe(true);
    expect(preview.analise_paragrafos).toEqual([]);
  });

  it("rejeita pontuacao que nao pertence a escala do ENEM", () => {
    const invalid = buildLocalPreview("Desigualdade educacional", essay);
    invalid.competencias[0].nota = 150 as never;
    expect(() => CorrectionSchema.parse(invalid)).toThrow();
  });
});

describe("valor do webhook", () => {
  it("normaliza valores em reais e em centavos", () => {
    expect(normalizePaymentAmountToCents("39.00")).toBe(3900);
    expect(normalizePaymentAmountToCents("39,00")).toBe(3900);
    expect(normalizePaymentAmountToCents("3900")).toBe(3900);
    expect(normalizePaymentAmountToCents("790")).toBe(790);
  });

  it("rejeita valor ausente, zerado ou invalido", () => {
    expect(normalizePaymentAmountToCents(null)).toBeNull();
    expect(normalizePaymentAmountToCents("0")).toBeNull();
    expect(normalizePaymentAmountToCents("invalido")).toBeNull();
  });
});
