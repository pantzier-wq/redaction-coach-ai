import { createFileRoute, Link } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Camera,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock3,
  FilePenLine,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { captureCheckoutAttribution } from "@/lib/checkout";

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
        content: "CorrigeAI — Descubra o que está separando sua redação dos 900+",
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
  const [session, setSession] = useState<Session | null>(null);

  const daysUntilEnem = useMemo(() => {
    const examDate = new Date("2026-11-08T00:00:00");
    return Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86400000));
  }, []);

  useEffect(() => {
    captureCheckoutAttribution();

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
                Faltam {daysUntilEnem} dias para o ENEM 2026
              </div>

              <h1 className="max-w-4xl font-['Fraunces'] text-5xl font-black leading-[0.94] tracking-tight md:text-7xl">
                Você pode estar perdendo muitos pontos{" "}
                <span className="italic text-[var(--red)]">sem perceber.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[var(--ink-2)] md:text-2xl">
                Os 900+ começam quando você entende exatamente o que corrigir. Entre na plataforma,
                envie sua redação e veja sua análise pelas cinco competências do ENEM.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
                    <Link
                      to="/auth"
                      search={{ mode: "signup" }}
                      className="group inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#16213A] px-7 py-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_40px_-16px_rgba(22,33,58,0.6)] transition hover:-translate-y-0.5 hover:bg-[#24365F]"
                    >
                      Criar minha conta
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
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
                  <CheckCircle2 className="h-4 w-4 text-[#24365F]" /> Cadastro rápido
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#24365F]" /> Planos dentro da plataforma
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
                <Feature icon={ShieldCheck} text="Escolha o plano ideal já dentro da sua conta" />
              </div>

              <div className="mt-7 rounded-2xl border border-[#24365F]/15 bg-white/70 p-4">
                <p className="text-sm font-bold leading-relaxed text-[var(--ink-2)]">
                  Crie sua conta gratuitamente para conhecer a área do aluno. Você escolhe seu plano
                  somente depois de entrar.
                </p>
              </div>
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
                title="Crie sua conta"
                text="Use seu e-mail e uma senha para acessar a plataforma."
              />
              <Step
                number="02"
                title="Escolha seu plano"
                text="Compare as opções por dentro e escolha conforme sua rotina de treino."
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
                Pare de treinar sem saber o que está segurando sua nota.
              </h2>
              <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-[var(--ink-2)]">
                Sua conta é o primeiro passo para acessar as correções, ferramentas e planos do
                CorrigeAI.
              </p>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="group mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl bg-[var(--red)] px-8 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_16px_30px_-14px_rgba(196,50,42,0.65)] transition hover:-translate-y-0.5"
              >
                Criar minha conta
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
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
