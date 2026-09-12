import { createFileRoute, Link } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock3,
  FilePenLine,
  MessageSquare,
  RouteIcon,
  ShieldCheck,
  Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { captureCheckoutAttribution } from "@/lib/checkout";

const loadAcquisitionFunnel = () => import("@/components/AcquisitionFunnel");
const AcquisitionFunnel = lazy(() =>
  loadAcquisitionFunnel().then((module) => ({ default: module.AcquisitionFunnel })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CorrigeAI — Entenda como melhorar sua redação do ENEM" },
      {
        name: "description",
        content:
          "Corrija sua redação pelas cinco competências do ENEM e descubra onde concentrar seu próximo treino.",
      },
      {
        property: "og:title",
        content: "CorrigeAI — Descubra o que pode estar afastando você da sua vaga",
      },
      {
        property: "og:description",
        content:
          "Cole ou fotografe sua redação e receba uma análise clara pelas cinco competências do ENEM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    captureCheckoutAttribution();
    try {
      if (sessionStorage.getItem("corrigeai:offer-return")) setFunnelOpen(true);
    } catch {
      /* O quiz também funciona sem armazenamento. */
    }

    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));

    [
      "checkout_return_stage",
      "funnel_auth_return",
      "quiz_answers",
      "pending_submission",
      "pending_essay_data",
      "pending_essay_photo",
      "resume_submission_after_auth",
    ].forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem("checkout_return_stage");

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const preloadTimer = window.setTimeout(() => void loadAcquisitionFunnel(), 600);
    return () => window.clearTimeout(preloadTimer);
  }, []);

  if (funnelOpen)
    return (
      <Suspense fallback={<FunnelLoading />}>
        <AcquisitionFunnel
          onClose={() => {
            setFunnelOpen(false);
            try {
              sessionStorage.removeItem("corrigeai:offer-return");
            } catch {
              /* Sem persistência. */
            }
          }}
        />
      </Suspense>
    );

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--paper)] font-['Public_Sans'] text-[var(--ink)] selection:bg-[var(--red-soft)] selection:text-[var(--red)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="leading-none">
            <p className="font-['Fraunces'] text-2xl font-black italic tracking-tight">
              CORRIGE<span className="text-[var(--red)]">AI</span>
            </p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--ink-3)]">
              Redação ENEM com direção
            </p>
          </Link>

          <Link
            to={session ? "/dashboard" : "/auth"}
            search={session ? undefined : { mode: undefined }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/65 px-5 text-xs font-black uppercase tracking-[0.12em] shadow-sm transition hover:border-[#24365F]/35 hover:bg-white"
          >
            {session ? "Abrir painel" : "Entrar"}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20">
          <div className="pointer-events-none absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-[var(--red)]/10 blur-3xl" />
          <div className="pointer-events-none absolute right-[-6rem] top-4 h-96 w-96 rounded-full bg-[#24365F]/8 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--red)]/20 bg-[var(--red-soft)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--red)]">
                <Clock3 className="h-4 w-4" />
                Quanto antes descobrir seus erros, mais cedo você pode se aproximar da nota 1000
              </div>

              <h1 className="max-w-4xl font-['Fraunces'] text-5xl font-black leading-[0.94] tracking-tight md:text-7xl">
                Sua redação pode estar afastando você da{" "}
                <span className="italic text-[var(--red)]">vaga que tanto quer.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[var(--ink-2)] md:text-2xl">
                Responda 6 perguntas rápidas, descubra o que pode estar segurando sua nota e
                experimente uma correção gratuita baseada nos critérios do INEP.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {session && (
                  <button
                    onClick={() => setFunnelOpen(true)}
                    className="min-h-14 rounded-2xl bg-[#16213A] px-7 py-4 text-sm font-bold text-white"
                  >
                    Responder às perguntas
                  </button>
                )}
                {session ? (
                  <Link
                    to="/dashboard"
                    className="group inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#16213A] px-7 py-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_40px_-16px_rgba(22,33,58,0.6)] transition hover:-translate-y-0.5 hover:bg-[#24365F]"
                  >
                    Acessar minha conta
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setFunnelOpen(true)}
                      className="group inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#16213A] px-7 py-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_40px_-16px_rgba(22,33,58,0.6)] transition hover:-translate-y-0.5 hover:bg-[#24365F]"
                    >
                      Descobrir o que está tirando meus pontos
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                    <Link
                      to="/auth"
                      search={{ mode: undefined }}
                      className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#24365F]/25 bg-white/55 px-7 py-4 text-sm font-black uppercase tracking-[0.1em] text-[#24365F] transition hover:-translate-y-0.5 hover:bg-white"
                    >
                      Entrar na minha conta
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-[var(--ink-3)]">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#24365F]" /> Ambiente seguro
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#24365F]" /> 6 perguntas simples
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#24365F]" /> Correção grátis para começar
                </span>
              </div>
            </div>

            <div className="relative rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(155deg,rgba(255,255,255,0.94),rgba(238,242,248,0.8))] p-6 shadow-[0_28px_80px_-36px_rgba(22,33,58,0.45)] md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
                Dentro do CorrigeAI
              </p>
              <h2 className="mt-2 font-['Fraunces'] text-3xl font-black leading-tight">
                Tudo o que você precisa para treinar com mais clareza
              </h2>

              <div className="mt-7 space-y-3">
                <Feature icon={Camera} text="Cole o texto ou fotografe sua redação" />
                <Feature icon={FilePenLine} text="Receba a leitura das cinco competências" />
                <Feature icon={ChartNoAxesCombined} text="Acompanhe seu histórico e sua evolução" />
                <Feature icon={ShieldCheck} text="Experimente sua primeira correção sem cartão" />
              </div>

              <div className="mt-7 rounded-2xl border border-[#24365F]/15 bg-white/70 p-4">
                <p className="text-sm font-bold leading-relaxed text-[var(--ink-2)]">
                  Primeiro, descubra seu foco de treino. Depois, crie sua conta e escolha como
                  começar. A correção gratuita não exige compra.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#16213A] px-4 py-16 text-white md:px-6 md:py-24">
          <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border-[70px] border-white/[0.035]" />
          <div className="pointer-events-none absolute -bottom-56 -left-32 h-[30rem] w-[30rem] rounded-full bg-[var(--red)]/15 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8D84]">
                Não é só uma nota
              </p>
              <h2 className="mt-3 font-['Fraunces'] text-4xl font-black leading-[1.02] tracking-tight md:text-5xl">
                É a vaga, o curso e a sensação de que todo o seu esforço valeu a pena.
              </h2>
              <p className="mt-5 text-base font-medium leading-relaxed text-white/72 md:text-lg">
                O pior não é cometer um erro. É chegar à prova sem saber se você continua repetindo
                o mesmo erro em cada nova redação.
              </p>
              <p className="mt-5 border-l-2 border-[#FF6F65] pl-4 text-lg font-black leading-snug text-white">
                Você não precisa treinar mais no escuro. Precisa saber onde concentrar seu próximo
                esforço.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ValueCard
                tone="danger"
                icon={RouteIcon}
                label="Sem direção"
                title="A mesma dúvida volta em cada texto"
                text="Você escreve, recebe uma nota e ainda não entende com clareza por que perdeu pontos."
              />
              <ValueCard
                tone="positive"
                icon={Target}
                label="Com direção"
                title="Cada correção vira um próximo passo"
                text="Você enxerga o que ajustar agora e leva um foco claro para a próxima redação."
              />
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--paper-2)]/65 px-4 py-14 md:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-9 max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
                Simples do começo ao fim
              </p>
              <h2 className="mt-2 font-['Fraunces'] text-4xl font-black tracking-tight">
                Três passos para começar
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Step
                number="01"
                title="Descubra seu foco"
                text="Responda 6 perguntas sobre sua rotina e suas dificuldades."
              />
              <Step
                number="02"
                title="Prepare seu próximo passo"
                text="Veja uma orientação simples e crie sua conta gratuitamente."
              />
              <Step
                number="03"
                title="Envie sua redação"
                text="Cole ou fotografe o texto para receber a correção e acompanhar sua evolução."
              />
            </div>
          </div>
        </section>

        {!session && (
          <section className="px-4 py-16 md:px-6 md:py-20">
            <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[2rem] border border-[var(--red)]/20 bg-[linear-gradient(135deg,var(--red-soft),rgba(255,255,255,0.92))] px-6 py-10 text-center shadow-[0_24px_60px_-36px_rgba(196,50,42,0.5)] md:px-10">
              <h2 className="max-w-3xl font-['Fraunces'] text-4xl font-black leading-tight">
                Sua próxima redação não precisa terminar com a mesma dúvida.
              </h2>
              <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-[var(--ink-2)]">
                Em 6 respostas, descubra seu ponto de atenção e comece a treinar com mais direção.
              </p>
              <button
                onClick={() => setFunnelOpen(true)}
                className="group mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl bg-[var(--red)] px-8 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_16px_30px_-14px_rgba(196,50,42,0.65)] transition hover:-translate-y-0.5"
              >
                Descobrir meu ponto de atenção
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--paper-2)] px-4 py-9 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-['Fraunces'] text-xl font-black italic">
              CORRIGE<span className="text-[var(--red)]">AI</span>
            </p>
            <p className="mt-1 text-xs font-medium text-[var(--ink-3)]">
              Clareza para evoluir uma redação de cada vez.
            </p>
          </div>
          <a
            href="https://wa.me/5548996736743?text=Olá! Tenho uma dúvida sobre o CorrigeAI."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-black text-[#24365F] transition hover:text-[var(--red)]"
          >
            <MessageSquare className="h-4 w-4" /> Falar com o suporte
          </a>
        </div>
      </footer>
    </div>
  );
}

function FunnelLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6 font-['Public_Sans'] text-[var(--ink)]"
      role="status"
      aria-live="polite"
    >
      <div className="corrige-soft-enter flex flex-col items-center text-center">
        <span className="corrige-loading-mark mb-5 font-['Fraunces'] text-3xl font-black italic">
          CORRIGE<span className="text-[var(--red)]">AI</span>
        </span>
        <p className="text-sm font-bold text-[var(--ink-2)]">Preparando suas perguntas…</p>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof Camera; text: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white/75 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F8] text-[#24365F]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-black leading-relaxed">{text}</p>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-sm">
      <span className="font-['Fraunces'] text-3xl font-black italic text-[var(--red)]">
        {number}
      </span>
      <h3 className="mt-5 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--ink-2)]">{text}</p>
    </div>
  );
}

function ValueCard({
  tone,
  icon: Icon,
  label,
  title,
  text,
}: {
  tone: "danger" | "positive";
  icon: typeof Target;
  label: string;
  title: string;
  text: string;
}) {
  const positive = tone === "positive";

  return (
    <div
      className={`rounded-[1.75rem] border p-6 md:p-7 ${
        positive
          ? "border-white/20 bg-white text-[#16213A] shadow-[0_24px_60px_-30px_rgba(255,255,255,0.5)]"
          : "border-[#FF776D]/35 bg-[#C4322A]/20 text-white"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          positive ? "bg-[#EAF0F9] text-[#24365F]" : "bg-[#C4322A] text-white"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p
        className={`mt-6 text-[10px] font-black uppercase tracking-[0.18em] ${
          positive ? "text-[#31518A]" : "text-[#FF9C95]"
        }`}
      >
        {label}
      </p>
      <h3 className="mt-2 font-['Fraunces'] text-2xl font-black leading-tight">{title}</h3>
      <p
        className={`mt-3 text-sm font-medium leading-relaxed ${
          positive ? "text-[#536078]" : "text-white/70"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
