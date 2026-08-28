import { describe, expect, it } from "vitest";
import { buildEssayProgress } from "@/lib/essay-progress";

describe("progresso das redacoes", () => {
  it("ordena as correcoes e calcula evolucao, media e competencias", () => {
    const progress = buildEssayProgress([
      {
        created_at: "2026-08-27T12:00:00Z",
        resultado: {
          nota_total: 800,
          competencias: [1, 2, 3, 4, 5].map((numero) => ({ numero, nota: 160 })),
        },
      },
      {
        created_at: "2026-08-20T12:00:00Z",
        resultado: {
          nota_total: 600,
          competencias: [1, 2, 3, 4, 5].map((numero) => ({ numero, nota: 120 })),
        },
      },
    ]);

    expect(progress).not.toBeNull();
    expect(progress?.average).toBe(700);
    expect(progress?.best).toBe(800);
    expect(progress?.latest).toBe(800);
    expect(progress?.evolution).toBe(200);
    expect(progress?.competencies.map((item) => item.media)).toEqual([140, 140, 140, 140, 140]);
    expect(progress?.chartData.map((item) => item.nota)).toEqual([600, 800]);
  });

  it("ignora registros sem resultado", () => {
    expect(buildEssayProgress([{ created_at: "2026-08-27T12:00:00Z" }])).toBeNull();
  });
});
