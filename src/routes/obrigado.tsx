import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Pagamento confirmado — CorrigeAI" },
      {
        name: "description",
        content:
          "Seu acesso ao CorrigeAI foi liberado. Volte para a área de redações e comece a corrigir suas redações do ENEM agora mesmo.",
      },
      { property: "og:title", content: "Pagamento confirmado — CorrigeAI" },
      {
        property: "og:description",
        content: "Acesso liberado! Volte para a área de redações e corrija sua próxima redação com a IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 border border-primary/40 animate-pulse">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Pagamento confirmado
        </span>

        <h1 className="mt-5 text-3xl md:text-4xl font-black italic tracking-tighter leading-tight">
          Seu acesso ao <span className="text-primary">CORRIGEAI</span> foi liberado!
        </h1>

        <p className="mt-4 text-sm md:text-base text-muted-foreground font-medium">
          Obrigado pela confiança. Agora é hora de treinar de verdade: cole sua redação,
          receba a correção nas 5 competências do ENEM e evolua a cada tentativa.
        </p>

        <div className="mt-8 grid gap-3 text-left">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <Zap className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm font-bold">
              Suas correções já estão disponíveis na área de redações.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm font-bold">
              Se o acesso não aparecer na hora, atualize a página ou entre novamente na sua conta.
            </p>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm md:text-base font-black uppercase tracking-tight text-primary-foreground shadow-xl transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Clique aqui pra voltar para a área de redações
          <ArrowRight className="h-5 w-5" />
        </Link>

        <Link
          to="/"
          className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
