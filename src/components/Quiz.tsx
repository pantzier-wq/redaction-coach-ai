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
    const nextAnswers = val
      ? { ...answers, [current.id]: val }
      : answers;

    if (val) {
      setAnswers(nextAnswers);
    }
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(nextAnswers);
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="corrige-soft-overlay fixed inset-0 z-[100] flex items-center justify-center bg-[var(--paper)]/95 backdrop-blur-md p-4 font-['Public_Sans']">
      <div className="corrige-soft-enter w-full max-w-xl rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[var(--paper-shadow)]">
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
          <button onClick={onClose} className="text-[var(--ink-3)] hover:text-[var(--red)] transition-colors p-2 hover:bg-[var(--line)]/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div key={step} className="corrige-soft-enter min-h-[350px] flex flex-col">
          <h3 className="font-['Fraunces'] text-2xl md:text-3xl font-black mb-8 leading-tight text-[var(--ink)]">
            {current.question}
          </h3>

          <div className="flex-1">

            {current.type === "options" && (
              <div className="grid gap-4">
                {current.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => next(opt)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]/50 px-8 py-6 text-left text-xl font-black text-[var(--ink)] hover:bg-[var(--paper-2)] hover:border-[#24365F] hover:text-[#24365F] transition-all flex items-center justify-between group shadow-sm"
                  >
                    {opt}
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--line)] group-hover:border-[#24365F] group-hover:bg-[#24365F] flex items-center justify-center transition-all">
                      <CheckCircle2 className="w-5 h-5 text-[var(--paper)] opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            )}

          </div>

          {step > 0 && (
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
