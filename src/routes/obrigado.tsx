import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, CheckCircle2, FileText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Pagamento confirmado - CorrigeAI" },
      {
        name: "description",
        content:
          "Seu acesso ao CorrigeAI foi liberado. Volte para a área de redações e comece a corrigir suas redações do ENEM agora mesmo.",
      },
      { property: "og:title", content: "Pagamento confirmado - CorrigeAI" },
      {
        property: "og:description",
        content:
          "Acesso liberado! Volte para a área de redações e corrija sua próxima redação com a IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

const nextSteps = [
  "Entre na sua área do aluno",
  "Cole sua próxima redação",
  "Receba a análise das 5 competências",
];

function ThankYouPage() {
  return (
    <main className="authenticated-shell relative min-h-screen overflow-hidden bg-[var(--paper)] font-['Public_Sans'] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 top-20 h-72 w-72 rounded-full bg-[var(--red-soft)] blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#EEF2F8] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(var(--line)_1px,transparent_1px)] [background-size:100%_42px]" />
      </div>

      <header className="relative z-10 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/" className="group leading-none" aria-label="Voltar para o inicio">
            <span className="font-['Fraunces'] text-2xl font-black italic tracking-tight text-[var(--ink)]">
              CORRIGE<span className="text-[var(--red)]">AI</span>
            </span>
            <span className="mt-1 block text-[7px] font-black uppercase tracking-[0.22em] text-[var(--ink-3)]">
              Redação ENEM com rigor de prova
            </span>
          </Link>

          <div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ink-3)] sm:flex">
            <ShieldCheck className="h-4 w-4 text-[#24365F]" />
            Ambiente seguro
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-86px)] max-w-6xl items-center px-5 py-10 md:px-8 md:py-16">
        <div className="corrige-soft-enter grid w-full overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/80 shadow-[0_28px_80px_-32px_rgba(22,33,58,0.32)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr] lg:rounded-[2.5rem]">
          <div className="relative px-6 py-10 text-center sm:px-10 sm:py-14 lg:px-14 lg:py-16 lg:text-left">
            <div className="absolute left-0 top-10 hidden h-24 w-1 rounded-r-full bg-[var(--red)] lg:block" />

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--red)] bg-[var(--red-soft)] shadow-[0_14px_36px_-16px_rgba(196,50,42,0.6)] lg:mx-0">
              <CheckCircle2 className="h-10 w-10 text-[var(--red)]" strokeWidth={2.2} />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--red)] sm:text-xs">
              Pagamento confirmado
            </p>
            <h1 className="mt-4 font-['Fraunces'] text-4xl font-black leading-[0.98] tracking-tight text-[var(--ink)] sm:text-5xl lg:text-6xl">
              Agora sua nota deixa de ser um palpite.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-relaxed text-[var(--ink-2)] sm:text-base lg:mx-0 lg:text-lg">
              Sua compra foi aprovada. As correções do seu plano já podem ser acessadas na área do
              aluno.
            </p>

            <Link
              to="/dashboard"
              className="group mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#16213A] px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_38px_-14px_rgba(22,33,58,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#24365F] active:translate-y-0 sm:w-auto sm:px-9"
            >
              Acessar área do aluno
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-3)]">
              Seu saldo é atualizado automaticamente
            </p>
          </div>

          <aside className="relative border-t border-[var(--line)] bg-[linear-gradient(145deg,#EEF2F8,rgba(255,255,255,0.92))] px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-12 lg:py-16">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#24365F] text-white shadow-[0_12px_24px_-12px_rgba(36,54,95,0.8)]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#24365F]">
                  Próximo passo
                </p>
                <h2 className="mt-1 font-['Fraunces'] text-2xl font-black text-[var(--ink)]">
                  Comece sua evolução
                </h2>
              </div>
            </div>

            <ol className="space-y-4">
              {nextSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-4 rounded-2xl border border-[#24365F]/10 bg-white/75 p-4 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--red-soft)] text-xs font-black text-[var(--red)]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold leading-snug text-[var(--ink)]">{step}</span>
                  <Check className="ml-auto h-4 w-4 shrink-0 text-[#24365F]" strokeWidth={3} />
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-2xl border border-[var(--red)]/20 bg-[var(--red-soft)] p-4">
              <p className="text-xs font-semibold leading-relaxed text-[var(--ink-2)]">
                Se o saldo ainda não aparecer, aguarde alguns segundos e atualize a área do aluno. A
                confirmação pode levar um instante.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
