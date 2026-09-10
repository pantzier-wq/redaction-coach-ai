import { describe, expect, it } from "vitest";
import { repertories, findRepertoryCandidates } from "@/data/repertories";
import { buildLocalPreview } from "@/lib/local-preview";
import { applyScoreAudit, CorrectionSchema, ScoreAuditSchema } from "@/lib/correct-essay.server";
import { normalizePaymentAmountToCents } from "@/lib/payment-validation";
import {
  containsUnexpectedWritingSystem,
  sanitizePortugueseFeedback,
} from "@/lib/portuguese-feedback";
import { hasEssayCredit } from "@/lib/correction-access";
import {
  completeOnboarding,
  markOnboardingPending,
  shouldStartOnboarding,
} from "@/lib/onboarding-tour";

const essay = `A desigualdade educacional ainda afeta muitos estudantes brasileiros. Esse problema limita oportunidades e amplia diferencas sociais.

Além disso, a falta de infraestrutura dificulta o aprendizado. Escolas sem recursos não conseguem garantir condições adequadas.

Portanto, o Estado deve criar programas de investimento e fiscalização, a fim de ampliar o acesso a uma educação de qualidade.`;

describe("acesso à correção", () => {
  it("libera a correção gratuita somente enquanto há saldo", () => {
    expect(hasEssayCredit(1)).toBe(true);
    expect(hasEssayCredit(0)).toBe(false);
    expect(hasEssayCredit(null)).toBe(false);
  });
});

describe("tutorial de primeira entrada", () => {
  function createStorage() {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
  }

  it("abre somente para a conta recém-criada e não reaparece após concluir", () => {
    const storage = createStorage();
    markOnboardingPending(storage, "aluno-novo");

    expect(shouldStartOnboarding(storage, "aluno-novo")).toBe(true);
    expect(shouldStartOnboarding(storage, "outra-conta")).toBe(false);

    completeOnboarding(storage, "aluno-novo");
    expect(shouldStartOnboarding(storage, "aluno-novo")).toBe(false);
  });
});

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

describe("idioma do feedback", () => {
  it("substitui o artefato em arabe observado na correcao", () => {
    const feedback = "Defina os meios de التنفيذ e especifique as medidas.";
    const sanitized = sanitizePortugueseFeedback(feedback);

    expect(sanitized).toBe("Defina os meios de execução e especifique as medidas.");
    expect(containsUnexpectedWritingSystem(sanitized)).toBe(false);
  });

  it("remove outros alfabetos inesperados do feedback", () => {
    const sanitized = sanitizePortugueseFeedback("Explique a ação 漢字 com mais clareza.");

    expect(sanitized).toBe("Explique a ação com mais clareza.");
    expect(containsUnexpectedWritingSystem(sanitized)).toBe(false);
  });
});

describe("travas da cartilha do ENEM 2025", () => {
  function correctionAtMaximum() {
    const correction = buildLocalPreview("Desigualdade educacional", essay);
    correction.competencias.forEach((competencia) => {
      competencia.nota = 200;
    });
    correction.nota_total = 1000;
    return correction;
  }

  function audit(overrides: Partial<ReturnType<typeof ScoreAuditSchema.parse>> = {}) {
    return ScoreAuditSchema.parse({
      situacao_tema: "integral",
      tipo_textual: "dissertativo_argumentativo",
      repertorio_c2: "produtivo",
      intervencao: {
        acao: true,
        agente: true,
        meio_modo: true,
        efeito_finalidade: true,
        detalhamento: true,
        respeita_direitos_humanos: true,
      },
      competencias: [1, 2, 3, 4, 5].map((numero) => ({
        numero,
        nota: 200,
        justificativa: "O descritor foi conferido diretamente no texto apresentado pelo aluno.",
      })),
      parecer_geral: "A segunda avaliação aplicou as faixas oficiais de forma independente.",
      ...overrides,
    });
  }

  it("limita C2, C3 e C5 a 40 quando ha tangenciamento", () => {
    const result = applyScoreAudit(
      correctionAtMaximum(),
      audit({ situacao_tema: "tangenciamento" }),
    );

    expect(result.competencias.map((item) => item.nota)).toEqual([200, 40, 40, 200, 40]);
  });

  it("impede 200 na C2 sem repertorio produtivo e limita C5 pelos elementos explicitos", () => {
    const result = applyScoreAudit(
      correctionAtMaximum(),
      audit({
        repertorio_c2: "pertinente_nao_produtivo",
        intervencao: {
          acao: true,
          agente: true,
          meio_modo: true,
          efeito_finalidade: false,
          detalhamento: false,
          respeita_direitos_humanos: true,
        },
      }),
    );

    expect(result.competencias[1].nota).toBe(160);
    expect(result.competencias[4].nota).toBe(120);
  });

  it("zera todas as competencias em caso de fuga total", () => {
    const result = applyScoreAudit(correctionAtMaximum(), audit({ situacao_tema: "fuga_total" }));

    expect(result.nota_total).toBe(0);
    expect(result.competencias.every((item) => item.nota === 0)).toBe(true);
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
