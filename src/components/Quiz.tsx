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
      id: "curso",
      question: "Qual curso você quer passar?",
      type: "text",
      placeholder: "Ex: Medicina, Direito, Engenharia...",
    },
    {
      id: "dificuldade",
      question: "Qual sua maior dificuldade hoje na redação?",
      type: "options",
      options: ["Introdução", "Desenvolvimento", "Proposta de Intervenção", "Gramática e Norma Culta"],
    },
    {
      id: "frequencia",
      question: "Quantas redações você faz por mês?",
      type: "options",
      options: ["0 (Ainda não comecei)", "1 a 2", "3 a 4", "Mais de 4"],
    },
    {
      id: "nota",
      question: "Qual foi sua última nota no simulado ou ENEM?",
      type: "options",
      options: ["Menos de 600", "Entre 600 e 800", "Acima de 800", "Nunca fiz"],
    },
    {
      id: "tempo",
      question: "Você sente que o tempo é seu maior inimigo agora?",
      type: "options",
      options: ["Sim, estou desesperado(a)", "Um pouco", "Não, estou tranquilo(a)"],
    },
    {
      id: "pronto",
      question: "Pronto para descobrir sua nota real e o que falta para o 1000?",
      type: "final",
      cta: "SIM, QUERO MINHA NOTA AGORA!",
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] animate-in zoom-in-95 duration-300">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-500",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="min-h-[300px] flex flex-col">
          <h3 className="text-2xl md:text-3xl font-black mb-8 leading-tight">
            {current.question}
          </h3>

          <div className="flex-1">
            {current.type === "text" && (
              <div className="space-y-4">
                <input
                  autoFocus
                  type="text"
                  placeholder={current.placeholder}
                  className="w-full rounded-2xl border border-border bg-input px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) next(e.currentTarget.value);
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value) next(input.value);
                  }}
                  className="w-full rounded-2xl bg-primary py-4 text-lg font-black text-primary-foreground hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {current.type === "options" && (
              <div className="grid gap-3">
                {current.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => next(opt)}
                    className="w-full rounded-2xl border border-border bg-muted/30 px-6 py-4 text-left text-lg font-bold hover:bg-primary/10 hover:border-primary/50 transition-all flex items-center justify-between group"
                  >
                    {opt}
                    <CheckCircle2 className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            {current.type === "final" && (
              <div className="text-center py-4">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                    <div className="relative p-6 rounded-full bg-card border-2 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">
                      <Trophy className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-8 font-medium">
                  Identificamos exatamente o que está bloqueando sua nota 900+.
                </p>
                <button
                  onClick={() => next()}
                  className="w-full rounded-2xl py-6 text-xl font-black text-white hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_25px_rgba(var(--primary-rgb),0.4)]"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  {current.cta}
                </button>
              </div>
            )}
          </div>

          {step > 0 && current.type !== "final" && (
            <button
              onClick={back}
              className="mt-8 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
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
