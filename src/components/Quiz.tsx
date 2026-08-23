import { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizProps {
  onComplete: (answers: Record<string, string>) => void;
  onClose: () => void;
}

export function Quiz({ onComplete, onClose }: QuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = [
    {
      id: "enem_date",
      question: "Quando você faz o ENEM?",
      type: "options",
      options: ["Esse ano", "Ano que vem", "Ainda vou decidir"],
    },
    {
      id: "essays_written",
      question: "Quantas redações você já escreveu treinando?",
      type: "options",
      options: ["Nenhuma ainda", "Menos de 5", "Entre 5 e 15", "Mais de 15"],
    },
    {
      id: "essays_corrected",
      question: "E dessas, quantas alguém corrigiu de verdade?",
      type: "options",
      options: ["Todas", "Algumas", "Quase nenhuma", "Nenhuma"],
    },
    {
      id: "understand_grade",
      question: "Quando você recebe uma nota, você entende por que tirou aquela nota?",
      type: "options",
      options: ["Sim, sempre me explicam", "Mais ou menos", "Não, só recebo o número"],
    },
    {
      id: "score_increase",
      question: "Se você soubesse exatamente onde perde ponto, quanto acha que sua nota subiria?",
      type: "options",
      options: ["Uns 50 pontos", "Entre 100 e 200", "Mais de 200"],
    },
    {
      id: "current_estimate",
      question: "Chuta: de 0 a 1000, quanto sua redação tira hoje?",
      type: "options",
      options: ["Menos de 600", "600 a 800", "800 a 900", "Mais de 900"],
    },
  ];

  const current = questions[step];

  const next = (val?: string) => {
    if (val) {
      setAnswers((prev) => ({ ...prev, [current.id]: val }));
    }
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--paper)]/95 backdrop-blur-md p-4 font-['Public_Sans']">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[var(--paper-shadow)] animate-in zoom-in-95 duration-300">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-500",
                  i <= step ? "bg-[var(--red)]" : "bg-[var(--line)]"
                )}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-[var(--ink-3)] hover:text-[var(--red)] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="min-h-[350px] flex flex-col">
          <h3 className="font-['Fraunces'] text-2xl md:text-3xl font-black mb-8 leading-tight text-[var(--ink)]">
            {current.question}
          </h3>

          <div className="flex-1">
            {current.type === "text" && (
              <div className="space-y-4">
                <input
                  autoFocus
                  type="text"
                  placeholder={current.placeholder}
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] px-6 py-5 text-lg text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--red)]/20 focus:border-[var(--red)] transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) next(e.currentTarget.value);
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value) next(input.value);
                  }}
                  className="w-full rounded-2xl bg-[var(--ink)] py-5 text-lg font-black text-[var(--paper)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {current.type === "options" && (
              <div className="grid gap-4">
                {current.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => next(opt)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]/50 px-8 py-6 text-left text-xl font-black text-[var(--ink)] hover:bg-[var(--paper-2)] hover:border-[var(--red)] hover:text-[var(--red)] transition-all flex items-center justify-between group shadow-sm"
                  >
                    {opt}
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--line)] group-hover:border-[var(--red)] group-hover:bg-[var(--red)] flex items-center justify-center transition-all">
                      <CheckCircle2 className="w-5 h-5 text-[var(--paper)] opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {current.type === "final" && (
              <div className="text-center py-4">
                <div className="mb-8 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-[var(--red)]/10" />
                    <div className="relative p-6 rounded-full bg-[var(--paper-2)] border-2 border-[var(--red)] shadow-[0_0_30px_rgba(196,50,42,0.2)]">
                      <Trophy className="w-12 h-12 text-[var(--red)]" />
                    </div>
                  </div>
                </div>
                <p className="text-[var(--ink-2)] mb-8 font-medium leading-relaxed">
                  Identificamos exatamente o que está bloqueando sua nota 900+ e como resolver em tempo recorde.
                </p>
                <button
                  onClick={() => next()}
                  className="w-full rounded-2xl bg-[var(--red)] py-6 text-xl font-black text-white hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_-12px_rgba(196,50,42,0.3)]"
                >
                  {current.cta}
                </button>
              </div>
            )}
          </div>

          {step > 0 && current.type !== "final" && (
            <button
              onClick={back}
              className="mt-8 flex items-center gap-2 text-sm font-bold text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
