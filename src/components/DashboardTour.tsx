import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  FileClock,
  PenLine,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

type TourIcon = ComponentType<{ className?: string }>;

interface TourStep {
  target: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: TourIcon;
}

interface DashboardTourProps {
  open: boolean;
  onFinish: () => void;
}

interface TargetBox {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

const steps: TourStep[] = [
  {
    target: "profile",
    eyebrow: "Bem-vindo ao CorrigeAI",
    title: "Este é o seu espaço de estudos",
    description:
      "Vamos fazer um passeio rápido. Em menos de um minuto, você saberá onde corrigir textos e acompanhar sua evolução.",
    icon: WandSparkles,
  },
  {
    target: "correcao",
    eyebrow: "Sua primeira parada",
    title: "Corrija sua redação",
    description:
      "Cole o texto ou fotografe a folha do caderno. Sua primeira correção é gratuita e analisa as cinco competências do ENEM.",
    icon: PenLine,
  },
  {
    target: "historico",
    eyebrow: "Tudo organizado",
    title: "Consulte suas correções",
    description:
      "No histórico, suas redações ficam reunidas para você reler os comentários e comparar seus resultados anteriores.",
    icon: FileClock,
  },
  {
    target: "progresso",
    eyebrow: "Evolução visível",
    title: "Descubra onde sua nota cresce",
    description:
      "Os gráficos mostram sua nota ao longo do tempo e quais competências precisam de mais atenção nos próximos treinos.",
    icon: ChartNoAxesCombined,
  },
  {
    target: "repertorios",
    eyebrow: "Argumentos mais fortes",
    title: "Encontre repertórios",
    description:
      "Use referências organizadas por tema e veja como conectá-las ao argumento sem cair em citações decoradas.",
    icon: BookOpen,
  },
  {
    target: "conectivos",
    eyebrow: "Texto bem conectado",
    title: "Varie seus conectivos",
    description:
      "Consulte opções por função e analise frases para melhorar a coesão sem inserir conectivos de forma artificial.",
    icon: Sparkles,
  },
  {
    target: "upgrade",
    eyebrow: "Continue treinando",
    title: "Escolha seu plano quando precisar",
    description:
      "Depois da correção gratuita, é aqui que você libera novas correções e as ferramentas completas de estudo.",
    icon: Check,
  },
];

export function DashboardTour({ open, onFinish }: DashboardTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetBox, setTargetBox] = useState<TargetBox | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const step = steps[stepIndex];

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => nextButtonRef.current?.focus(), 120);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onFinish();
      if (event.key === "ArrowRight") {
        setStepIndex((current) => (current === steps.length - 1 ? current : current + 1));
      }
      if (event.key === "ArrowLeft") setStepIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onFinish, open]);

  useEffect(() => {
    if (!open) return;

    let frame = 0;
    let settleTimer = 0;
    const updateTarget = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!target) {
        setTargetBox(null);
        return;
      }

      target.scrollIntoView({ block: "nearest" });
      const rect = target.getBoundingClientRect();
      setTargetBox({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      });
    };

    frame = window.requestAnimationFrame(updateTarget);
    // No celular, o menu lateral leva 300 ms para entrar na tela.
    settleTimer = window.setTimeout(updateTarget, 340);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [open, step.target]);

  if (!open || typeof document === "undefined") return null;

  const isLastStep = stepIndex === steps.length - 1;
  const isDesktop = window.innerWidth >= 768;
  const placeMobileCardAtTop =
    !isDesktop && targetBox ? targetBox.top + targetBox.height / 2 > window.innerHeight / 2 : false;
  const cardStyle = targetBox
    ? isDesktop
      ? {
          left: Math.min(targetBox.right + 22, window.innerWidth - 402),
          top: Math.max(20, Math.min(targetBox.top - 12, window.innerHeight - 390)),
        }
      : placeMobileCardAtTop
        ? { top: 12, bottom: "auto" }
        : { top: "auto", bottom: 12 }
    : undefined;
  const StepIcon = step.icon;

  return createPortal(
    <div className="fixed inset-0 z-[100] font-['Public_Sans']" role="dialog" aria-modal="true">
      <div className="absolute inset-0" aria-hidden="true" />
      {targetBox ? (
        <div
          className="pointer-events-none fixed z-[101] rounded-2xl border-2 border-white bg-transparent shadow-[0_0_0_9999px_rgba(10,16,31,0.72),0_0_0_6px_rgba(196,50,42,0.32)] transition-all duration-300"
          style={{
            top: Math.max(8, targetBox.top - 7),
            left: Math.max(8, targetBox.left - 7),
            width: targetBox.width + 14,
            height: targetBox.height + 14,
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-[101] bg-[#0A101F]/75" />
      )}

      <section
        className="fixed bottom-3 left-3 right-3 z-[102] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-[380px] overflow-y-auto rounded-[1.75rem] border border-white/70 bg-[#FBFAF7] shadow-[0_28px_90px_rgba(0,0,0,0.38)] transition-[top,bottom] duration-300 md:bottom-auto md:m-0 md:w-[380px] md:overflow-hidden"
        style={cardStyle}
      >
        <div className="h-1.5 bg-[#E4E0D6]">
          <div
            className="h-full bg-[#C4322A] transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FBEEEB] text-[#C4322A]">
              <StepIcon className="h-5 w-5" />
            </span>
            <button
              type="button"
              onClick={onFinish}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#7B8398] transition hover:bg-[#F0EEE8] hover:text-[#16213A]"
              aria-label="Pular tutorial"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#C4322A]">
            {step.eyebrow}
          </p>
          <h2 className="mt-2 font-['Fraunces'] text-2xl font-black leading-tight text-[#16213A]">
            {step.title}
          </h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#4C5670]">
            {step.description}
          </p>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E4E0D6] pt-4">
            <div className="flex items-center gap-2">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => current - 1)}
                  className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-xs font-black uppercase tracking-wider text-[#4C5670] transition hover:bg-[#F0EEE8]"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onFinish}
                  className="h-10 px-2 text-xs font-bold text-[#7B8398] underline-offset-4 hover:underline"
                >
                  Pular
                </button>
              )}
              <span className="text-[10px] font-black tabular-nums text-[#7B8398]">
                {stepIndex + 1}/{steps.length}
              </span>
            </div>

            <button
              ref={nextButtonRef}
              type="button"
              onClick={() => {
                if (isLastStep) onFinish();
                else setStepIndex((current) => current + 1);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#16213A] px-4 text-xs font-black uppercase tracking-[0.08em] text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#24365F] focus:outline-none focus:ring-2 focus:ring-[#C4322A] focus:ring-offset-2"
            >
              {isLastStep ? "Começar" : "Próximo"}
              {isLastStep ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
