import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Quiz } from "@/components/Quiz";
import { supabase } from "@/integrations/supabase/client";
import { EssaySubmissionArea } from "@/components/EssaySubmissionArea";
import depoimentoCarolina from "@/assets/depoimento-carolina.jpg";

import { 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Flame,
  Users,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CorrigeAI — Corrija sua redação do ENEM em 30 segundos com IA" },
      {
        name: "description",
        content:
          "Faltam poucas semanas para o ENEM? A CorrigeAI corrige sua redação em segundos com o rigor de um corretor real do INEP. Descubra sua nota agora.",
      },
      { property: "og:title", content: "CorrigeAI — Sua redação nota 1000 antes do ENEM" },
      {
        property: "og:description",
        content: "Cole sua redação e receba correção nas 5 competências do ENEM em segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [session, setSession] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {showQuiz && (
        <Quiz 
          onClose={() => setShowQuiz(false)} 
          onComplete={() => {
            setShowQuiz(false);
            const el = document.getElementById("corrigir");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}
      <header className="absolute top-0 right-0 p-6 z-50">
        <Link 
          to={session ? "/dashboard" : "/auth"}
          className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors border border-border/50 bg-card/30 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2"
        >
          {session ? (
            <>Dashboard <ArrowRight className="w-4 h-4" /></>
          ) : (
            "Entrar"
          )}
        </Link>
      </header>

      <section className="relative overflow-hidden min-h-[80vh] flex flex-col justify-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-10 text-center">
          <h1 className="text-4xl md:text-7xl font-black leading-[1.05] tracking-tight">
            Em 2 minutos você descobre sua{" "}
            <span
              style={{
                background: "var(--gradient-hero)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              nota real
            </span>{" "}
            do ENEM e por que ela é essa.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-2xl text-muted-foreground font-medium">
            Responda 6 perguntas rápidas, cole sua redação e receba a nota nas 5 competências oficiais do ENEM.
          </p>

          <div className="mt-10">
            <button
              onClick={() => setShowQuiz(true)}
              className="inline-flex items-center justify-center rounded-2xl px-10 py-6 text-xl md:text-2xl font-black text-primary-foreground transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]"
              style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
            >
              DESCUBRIR MINHA NOTA AGORA →
            </button>
          </div>
        </div>
      </section>


      <footer className="border-t border-border py-12 text-center bg-card/30">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 grid gap-8 md:grid-cols-2 text-left">
            <div>
              <h3 className="text-xl font-black mb-4 tracking-tighter italic">CORRIGE<span className="text-primary">AI</span></h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A tecnologia mais avançada de correção de redação para o ENEM. Treine com o rigor oficial do INEP e conquiste sua vaga.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Suporte e Contato</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Dúvidas sobre o sistema ou pagamentos? Fale conosco:
              </p>
              <a
                href="https://wa.me/5548996736743?text=Olá! Tenho uma dúvida sobre o CorrigeAI."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-black text-white transition-all hover:scale-105 hover:bg-[#20ba5a] active:scale-95 shadow-[0_4px_14px_0_rgba(37,211,102,0.39)]"
              >
                <MessageSquare className="w-5 h-5" />
                WHATSAPP SUPORTE
              </a>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} CorrigeAI. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
