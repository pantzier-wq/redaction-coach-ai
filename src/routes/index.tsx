import { createFileRoute, Link } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Quiz } from "@/components/Quiz";
import { supabase } from "@/integrations/supabase/client";
import { captureCheckoutAttribution } from "@/lib/checkout";
import alunoAvatar1 from "@/assets/aluno-avatar-1.jpg";
import alunoAvatar2 from "@/assets/aluno-avatar-2.jpg";
import alunoAvatar3 from "@/assets/aluno-avatar-3.jpg";
import alunoAvatar4 from "@/assets/aluno-avatar-4.jpg";
import alunoAvatar5 from "@/assets/aluno-avatar-5.jpg";
import comparativoAntes from "@/assets/comparativo-antes-ia.jpg";
import comparativoDepois from "@/assets/comparativo-depois-ia.jpg";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FilePenLine,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

const QUIZ_ANALYSIS_DURATION_MS = 2600;
const loadEssaySubmissionArea = () => import("@/components/EssaySubmissionArea");
const loadFunnelSignup = () => import("@/components/FunnelSignup");
const EssaySubmissionArea = lazy(() =>
  loadEssaySubmissionArea().then((module) => ({ default: module.EssaySubmissionArea })),
);
const FunnelSignup = lazy(() =>
  loadFunnelSignup().then((module) => ({ default: module.FunnelSignup })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CorrigeAI — Descubra sua nota real do ENEM antes da prova" },
      {
        name: "description",
        content:
          "Cole sua redação e receba uma correção completa nas 5 competências do ENEM com nota, análise e plano de melhoria.",
      },
      {
        property: "og:title",
        content: "CorrigeAI — Sua redação pode estar valendo menos do que você imagina",
      },
      {
        property: "og:description",
        content:
          "Descubra onde você perde ponto no ENEM e veja sua nota real com feedback detalhado em poucos minutos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [session, setSession] = useState<Session | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<Record<string, string> | null>(null);
  const [isAnalyzingQuiz, setIsAnalyzingQuiz] = useState(false);
  const [showEssayForm, setShowEssayForm] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const daysUntilEnem = useMemo(() => {
    const examDate = new Date("2026-11-08T00:00:00");
    const now = new Date();
    return Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / 86400000));
  }, []);

  useEffect(() => {
    captureCheckoutAttribution();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    setShowQuiz(false);
    setIsAnalyzingQuiz(false);
    setShowSignup(false);

    const navigationEntry = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const isPageRefresh = navigationEntry?.type === "reload";
    const returnStage = localStorage.getItem("checkout_return_stage");
    const funnelAuthReturn = localStorage.getItem("funnel_auth_return");
    const savedQuiz = localStorage.getItem("quiz_answers");
    if (!isPageRefresh && (returnStage || funnelAuthReturn) && savedQuiz) {
      try {
        setQuizResult(JSON.parse(savedQuiz));
        setShowEssayForm(funnelAuthReturn === "1" || !!returnStage);
        localStorage.removeItem("funnel_auth_return");
      } catch {
        localStorage.removeItem("checkout_return_stage");
        localStorage.removeItem("funnel_auth_return");
        localStorage.removeItem("quiz_answers");
        setQuizResult(null);
        setShowEssayForm(false);
      }
    } else {
      [
        "checkout_return_stage",
        "funnel_auth_return",
        "quiz_answers",
        "pending_submission",
        "pending_essay_data",
        "pending_essay_photo",
        "resume_submission_after_auth",
        "viewing_essay",
      ].forEach((key) => localStorage.removeItem(key));
      setQuizResult(null);
      setShowEssayForm(false);
    }

    return () => subscription.unsubscribe();
  }, []);

  const startQuiz = () => {
    localStorage.removeItem("checkout_return_stage");
    localStorage.removeItem("funnel_auth_return");
    void loadEssaySubmissionArea();
    void loadFunnelSignup();
    setShowQuiz(true);
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-['Public_Sans'] selection:bg-[var(--red-soft)] selection:text-[var(--red)]">
      {showQuiz && (
        <Quiz
          onClose={() => setShowQuiz(false)}
          onComplete={(answers) => {
            setShowQuiz(false);
            setIsAnalyzingQuiz(true);
            setQuizResult(answers);
            localStorage.setItem("quiz_answers", JSON.stringify(answers));
            window.setTimeout(() => {
              setIsAnalyzingQuiz(false);
              window.setTimeout(() => {
                document.getElementById("corrigir")?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }, QUIZ_ANALYSIS_DURATION_MS);
          }}
        />
      )}

      {isAnalyzingQuiz && (
        <div className="corrige-soft-overlay fixed inset-0 z-[110] flex items-center justify-center bg-[var(--paper)]/95 p-6 backdrop-blur-md">
          <div className="corrige-soft-enter w-full max-w-md text-center">
            <div className="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--red)]" />
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--red)]">
              Analisando suas respostas
            </p>
            <h2 className="font-['Fraunces'] text-3xl font-black text-[var(--ink)]">
              Preparando seu ponto de partida...
            </h2>
            <div className="mx-auto mt-8 h-2 max-w-sm overflow-hidden rounded-full bg-[var(--line)]">
              <div className="h-full w-full origin-left animate-[quiz-analysis_2.6s_linear] bg-[var(--red)]" />
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--ink-3)]">
              Cruzando seus hábitos de treino com as competências do ENEM.
            </p>
          </div>
          <style>{`@keyframes quiz-analysis { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
        </div>
      )}

      {!quizResult && (
        <>
          <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
              <div>
                <p className="font-['Fraunces'] text-2xl font-black italic tracking-tight text-[var(--ink)]">
                  CORRIGE<span className="text-[var(--red)]">AI</span>
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ink-3)]">
                  Redação ENEM com rigor de prova
                </p>
              </div>

              <Link
                to={session ? "/dashboard" : "/auth"}
                className="group relative isolate inline-flex min-h-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/45 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--ink)] backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:bg-white/60 active:translate-y-0 sm:px-5 sm:text-xs sm:tracking-[0.16em]"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(235,239,247,0.42) 54%, rgba(255,255,255,0.58) 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.96), inset 0 -1px 0 rgba(22,33,58,0.08), 0 10px 28px -16px rgba(22,33,58,0.48)",
                }}
              >
                <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/95" />
                <span className="relative whitespace-nowrap">
                  {session ? "Meu painel" : "Entrar"}
                </span>
              </Link>
            </div>
          </header>

          <section className="relative overflow-hidden px-4 pb-20 pt-10 md:px-6 md:pb-28 md:pt-16">
            <div className="absolute left-1/2 top-0 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[var(--red)]/8 blur-3xl" />
            <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-[var(--red-soft)] blur-3xl" />

            <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--red)]/20 bg-[var(--red-soft)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--red)]">
                    <Clock3 className="h-4 w-4" />
                    Faltam {daysUntilEnem} dias para o ENEM 2026
                  </div>

                  <h1 className="max-w-4xl font-['Fraunces'] text-5xl font-black leading-[0.92] tracking-tight text-[var(--ink)] md:text-7xl">
                    Sua redação pode estar{" "}
                    <span className="text-[var(--red)] italic">100 pontos abaixo</span> do que você
                    imagina.
                  </h1>

                  <p className="max-w-2xl text-lg font-medium leading-relaxed text-[var(--ink-2)] md:text-2xl">
                    Responda 6 perguntas rápidas, cole sua redação e veja sua nota real nas 5
                    competências do ENEM com uma análise clara, direta e acionável.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <ProofPill icon={ShieldCheck} text="Critérios alinhados ao INEP" />
                  <ProofPill icon={TrendingUp} text="Feedback para subir nota" />
                  <ProofPill icon={FilePenLine} text="Resultado em poucos minutos" />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={startQuiz}
                    className="group inline-flex items-center justify-center rounded-2xl bg-[var(--ink)] px-8 py-5 text-lg font-black text-[var(--paper)] shadow-[0_20px_40px_-12px_rgba(22,33,58,0.25)] transition-all hover:scale-[1.02]"
                  >
                    RESPONDER PERGUNTAS AGORA
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div
                      className="flex shrink-0 -space-x-3"
                      aria-label="Estudantes usando o CorrigeAI"
                    >
                      {[
                        { src: alunoAvatar1, position: "50% 34%" },
                        { src: alunoAvatar2, position: "50% 30%" },
                        { src: alunoAvatar3, position: "50% 28%" },
                        { src: alunoAvatar4, position: "50% 18%" },
                        { src: alunoAvatar5, position: "50% 28%" },
                      ].map((avatar, index) => (
                        <img
                          key={avatar.src}
                          src={avatar.src}
                          alt={`Estudante ${index + 1}`}
                          width={40}
                          height={40}
                          decoding="async"
                          className="h-9 w-9 rounded-full border-2 border-[var(--paper)] object-cover shadow-sm transition-transform duration-300 hover:z-10 hover:-translate-y-1 sm:h-10 sm:w-10"
                          style={{ objectPosition: avatar.position }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase leading-relaxed tracking-[0.1em] text-[var(--ink-3)] sm:text-sm sm:tracking-widest">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-green-500" />
                      214 alunos analisando redação agora
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard value="+12 mil" label="Redações processadas" />
                  <StatCard value="5/5" label="Competências avaliadas" />
                  <StatCard value="23 segundos" label="Para gerar sua análise inicial" />
                </div>
              </div>

              <div className="space-y-5 rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,242,236,0.96))] p-6 shadow-[0_24px_70px_-24px_rgba(22,33,58,0.22)] md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
                      O que você vai descobrir
                    </p>
                    <h2 className="mt-2 font-['Fraunces'] text-3xl font-black text-[var(--ink)]">
                      Sua nota sem achismo
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-[var(--red-soft)] p-3 text-[var(--red)]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "Nota total de 0 a 1000",
                    "Notas separadas nas 5 competências",
                    "Pontos fortes e pontos que derrubam sua nota",
                    "Leitura simples para saber onde treinar primeiro",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-4"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--red)]" />
                      <p className="text-sm font-bold leading-relaxed text-[var(--ink)]">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.75rem] border border-[var(--red)]/15 bg-[var(--red-soft)] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
                    Para quem é
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--ink)]">
                    Ideal para quem está estudando em cima da hora, sente que a redação travou a
                    nota e quer parar de adivinhar onde está errando.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-deferred px-4 py-8 md:px-6">
            <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
              <BenefitCard
                icon={Target}
                title="Você para de chutar"
                description="Em vez de olhar uma nota solta, você entende exatamente em qual competência está deixando ponto na mesa."
              />
              <BenefitCard
                icon={FilePenLine}
                title="Você recebe correção com direção"
                description="A plataforma mostra a falha, explica o impacto na nota e te entrega um norte claro para a próxima versão."
              />
              <BenefitCard
                icon={TrendingUp}
                title="Você treina com estratégia"
                description="A ideia não é só corrigir uma redação. É criar um ciclo rápido de erro, ajuste e evolução até a prova."
              />
            </div>
          </section>

          <section className="landing-deferred px-4 py-10 md:px-6 md:py-14">
            <div className="mx-auto grid max-w-5xl items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-5">
              <div className="overflow-hidden rounded-[2rem] border-2 border-[var(--red)]/30 bg-[linear-gradient(145deg,var(--red-soft),rgba(255,255,255,0.92))] shadow-[0_20px_50px_-30px_rgba(196,50,42,0.5)]">
                <img
                  src={comparativoAntes}
                  alt="Estudante sem direção durante o treino de redação"
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={900}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-6 md:p-8">
                  <div className="mb-5 inline-flex rounded-full border border-[var(--red)]/25 bg-white/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--red)]">
                    Antes
                  </div>
                  <h2 className="font-['Fraunces'] text-2xl font-black leading-tight text-[var(--ink)] md:text-3xl">
                    Treino sem direção
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-[var(--ink-2)] md:text-base">
                    O aluno escreve, acha que foi bem e continua repetindo os mesmos erros sem
                    perceber onde perde pontos.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center py-1 text-[var(--ink-3)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper)] shadow-sm">
                  <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border-2 border-[#24365F]/30 bg-[linear-gradient(145deg,#EEF2F8,rgba(255,255,255,0.94))] shadow-[0_20px_50px_-30px_rgba(22,33,58,0.5)]">
                <img
                  src={comparativoDepois}
                  alt="Estudante organizada durante o treino estratégico de redação"
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={900}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-6 md:p-8">
                  <div className="mb-5 inline-flex rounded-full border border-[#24365F]/25 bg-white/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#24365F]">
                    Depois
                  </div>
                  <h2 className="font-['Fraunces'] text-2xl font-black leading-tight text-[var(--ink)] md:text-3xl">
                    Estudo com estratégia
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-[var(--ink-2)] md:text-base">
                    O aluno entende as competências, identifica as prioridades e sabe exatamente o
                    que revisar antes do próximo treino.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-deferred px-4 py-6 md:px-6 md:py-10">
            <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-[var(--red)]/25 bg-[linear-gradient(135deg,rgba(251,237,235,0.92),rgba(255,255,255,0.96))] p-8 shadow-[0_28px_70px_-28px_rgba(196,50,42,0.35)] md:p-12">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
                    Hora de agir
                  </p>
                  <h2 className="font-['Fraunces'] text-4xl font-black leading-tight text-[var(--ink)]">
                    Quanto mais perto da prova, mais caro fica continuar treinando no escuro.
                  </h2>
                  <p className="max-w-3xl text-base font-medium leading-relaxed text-[var(--ink-2)]">
                    Se a redação está segurando sua aprovação, comece entendendo seu ponto de
                    partida. Você descobre sua nota, entende a falha e entra na prova com muito mais
                    clareza do que tem hoje.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startQuiz}
                  className="group inline-flex items-center justify-center rounded-2xl bg-[#16213A] px-8 py-5 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_-12px_rgba(22,33,58,0.48)] transition-all hover:scale-[1.02] hover:bg-[#24365F]"
                >
                  DESCOBRIR MEU PONTO DE PARTIDA
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </section>

          <section className="landing-deferred px-4 py-12 md:px-6 md:py-16">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
                  Perguntas frequentes
                </p>
                <h2 className="mt-2 font-['Fraunces'] text-4xl font-black text-[var(--ink)]">
                  O que o aluno quer saber antes de testar
                </h2>
              </div>

              <div className="space-y-4">
                <FaqItem
                  question="A correção segue as 5 competências do ENEM?"
                  answer="Sim. O foco do produto é mostrar nota total, nota por competência e uma análise que faça sentido para quem treina redação no formato do ENEM."
                />
                <FaqItem
                  question="Preciso já escrever bem para usar?"
                  answer="Não. A proposta é justamente ajudar quem ainda não sabe onde está errando e precisa de direção para melhorar mais rápido."
                />
                <FaqItem
                  question="O resultado vem só com a nota?"
                  answer="Não. A nota é o começo. O valor real está em entender onde você perdeu ponto e qual parte precisa atacar primeiro."
                />
                <FaqItem
                  question="Isso é útil para quem está perto da prova?"
                  answer="É justamente o cenário mais urgente. Quando o tempo está curto, feedback rápido e objetivo vale mais do que continuar treinando sem referência."
                />
              </div>
            </div>
          </section>

          <footer className="border-t border-[var(--line)] bg-[var(--paper-2)] py-16">
            <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-[1fr_auto] md:px-6">
              <div className="space-y-4">
                <h3 className="font-['Fraunces'] text-2xl font-black italic tracking-tight text-[var(--ink)]">
                  CORRIGE<span className="text-[var(--red)]">AI</span>
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-[var(--ink-2)]">
                  Correção de redação para quem quer clareza, velocidade e um plano melhor para
                  subir nota no ENEM.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--red)]">
                  Suporte
                </p>
                <a
                  href="https://wa.me/5548996736743?text=Olá! Tenho uma dúvida sobre o CorrigeAI."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-sm font-black text-white shadow-[0_10px_20px_-5px_rgba(37,211,102,0.4)] transition-transform hover:scale-105"
                >
                  <MessageSquare className="h-5 w-5" />
                  FALAR COM SUPORTE
                </a>
              </div>
            </div>
          </footer>
        </>
      )}

      {quizResult && !isAnalyzingQuiz && (
        <section id="corrigir" className="corrige-soft-enter mx-auto max-w-4xl px-4 py-20">
          <Suspense fallback={<FlowLoading />}>
            {!showEssayForm && (
              <QuizStartingPoint
                answers={quizResult}
                onContinue={() => {
                  setShowEssayForm(true);
                  window.setTimeout(
                    () =>
                      document
                        .getElementById("essay-stage")
                        ?.scrollIntoView({ behavior: "smooth" }),
                    50,
                  );
                }}
              />
            )}

            {showEssayForm && !showSignup && (
              <div id="essay-stage" className="corrige-soft-enter">
                <EssaySubmissionArea
                  isLoggedIn={!!session}
                  isPro={false}
                  hideTheme
                  showEssayForm
                  onRequireSignup={() => {
                    setShowSignup(true);
                    window.setTimeout(
                      () =>
                        document
                          .getElementById("signup-stage")
                          ?.scrollIntoView({ behavior: "smooth" }),
                      50,
                    );
                  }}
                />
              </div>
            )}

            {showSignup && !session && (
              <div id="signup-stage" className="corrige-soft-enter">
                <FunnelSignup
                  onComplete={() => {
                    setShowSignup(false);
                    setShowEssayForm(true);
                  }}
                />
              </div>
            )}
          </Suspense>
        </section>
      )}
    </div>
  );
}

function FlowLoading() {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-8 text-center text-sm font-bold text-[var(--ink-2)]">
      Preparando a próxima etapa...
    </div>
  );
}

function QuizStartingPoint({
  answers,
  onContinue,
}: {
  answers: Record<string, string>;
  onContinue: () => void;
}) {
  const hasPractice = answers.essays_written !== "Nenhuma ainda";
  const hasLittleFeedback = ["Quase nenhuma", "Nenhuma"].includes(answers.essays_corrected || "");
  const lacksClarity = answers.understand_grade !== "Sim, sempre me explicam";
  const title = !hasPractice
    ? "Sua evolução começa com uma primeira referência clara."
    : hasLittleFeedback || lacksClarity
      ? "Você treina. Agora falta transformar esforço em direção."
      : "Você já tem prática. Agora é hora de encontrar os ajustes que elevam sua nota.";

  return (
    <div className="rounded-[2rem] border border-[var(--red)]/25 bg-[var(--paper)] p-5 shadow-[0_24px_70px_-30px_rgba(22,33,58,0.32)] md:p-8">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--red-soft)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
        <Sparkles className="h-4 w-4" /> Seu ponto de partida
      </div>

      <h2 className="max-w-3xl font-['Fraunces'] text-2xl font-black leading-tight text-[var(--ink)] md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-[var(--ink-2)] md:text-base">
        Pelas suas respostas, o próximo salto não depende apenas de escrever mais. Ele começa quando
        você entende quais critérios já domina e quais ainda estão segurando sua pontuação.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2 md:mt-6 md:gap-3">
        <StartingPointItem
          label="Ritmo de treino"
          value={answers.essays_written || "Não informado"}
        />
        <StartingPointItem
          label="Correções recebidas"
          value={answers.essays_corrected || "Não informado"}
        />
        <StartingPointItem
          label="Evolução que você percebe"
          value={answers.score_increase || "Ainda não estimada"}
        />
      </div>

      <div className="mt-5 rounded-2xl border-l-4 border-[var(--red)] bg-[var(--red-soft)] p-3 md:mt-6 md:p-5">
        <p className="text-sm font-bold leading-relaxed text-[var(--ink)] md:text-base">
          O quiz revela seus hábitos. Sua redação mostra, nas cinco competências, onde está o
          próximo avanço.
        </p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 inline-flex min-h-14 w-full touch-manipulation items-center justify-center rounded-2xl bg-[#16213A] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_14px_30px_-14px_rgba(22,33,58,0.5)] transition-[transform,background-color] duration-150 hover:bg-[#24365F] active:scale-[0.98] md:w-auto md:px-8"
      >
        COLAR MINHA REDAÇÃO AGORA
        <ArrowRight className="ml-2 h-4 w-4" />
      </button>
    </div>
  );
}

function StartingPointItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-3 md:p-4">
      <p className="text-[8px] font-black uppercase leading-tight tracking-[0.12em] text-[var(--ink-3)] md:text-[9px] md:tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-2 break-words text-xs font-black leading-snug text-[var(--ink)] md:text-sm">
        {value}
      </p>
    </div>
  );
}

function ProofPill({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 shadow-[var(--paper-shadow)]">
      <Icon className="h-4 w-4 text-[var(--red)]" />
      <span className="text-sm font-bold text-[var(--ink)]">{text}</span>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[var(--paper-shadow)]">
      <p className="font-['Fraunces'] text-3xl font-black text-[var(--red)]">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink-3)]">
        {label}
      </p>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Target;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[var(--paper-shadow)]">
      <div className="mb-4 inline-flex rounded-2xl bg-[var(--red-soft)] p-3 text-[var(--red)]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-['Fraunces'] text-2xl font-black text-[var(--ink)]">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-relaxed text-[var(--ink-2)]">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-[1.75rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[var(--paper-shadow)]">
      <summary className="cursor-pointer list-none text-left font-['Fraunces'] text-2xl font-black text-[var(--ink)] marker:hidden">
        <div className="flex items-center justify-between gap-4">
          <span>{question}</span>
          <span className="rounded-full bg-[var(--paper-2)] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--red)] transition-transform group-open:rotate-180">
            +
          </span>
        </div>
      </summary>
      <p className="pt-4 text-sm font-medium leading-relaxed text-[var(--ink-2)]">{answer}</p>
    </details>
  );
}
