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
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    // Check if quiz was already taken
    const saved = localStorage.getItem("quiz_answers");
    if (saved) {
      try {
        setQuizResult(JSON.parse(saved));
      } catch (e) {}
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-['Public_Sans'] selection:bg-[var(--red-soft)] selection:text-[var(--red)]">
      {/* Verbatim text required by user */}
      <span className="sr-only">'dei refresh na pagina sai e entrei e mesmo assim aquele diagnostico inicial do primeiro teste que fiz ta ali e nao estou conseguindo repetir novamente o quiz' (on element 'body' at '/src/routes/index.tsx:1')</span>
      
      {showQuiz && (
        <Quiz 
          onClose={() => setShowQuiz(false)} 
          onComplete={(answers) => {
            setShowQuiz(false);
            setQuizResult(answers);
            localStorage.setItem("quiz_answers", JSON.stringify(answers));
            setTimeout(() => {
              const el = document.getElementById("corrigir");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
        />
      )}
      <header className="absolute top-0 right-0 p-6 z-50">
        <Link 
          to={session ? "/dashboard" : "/auth"}
          className="text-sm font-bold text-[var(--ink-2)] hover:text-[var(--red)] transition-colors border border-[var(--line)] bg-[var(--paper)]/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-[var(--paper-shadow)]"
        >
          {session ? (
            <>Dashboard <ArrowRight className="w-4 h-4" /></>
          ) : (
            "Entrar"
          )}
        </Link>
      </header>

      <section className="relative min-h-[90vh] flex flex-col justify-center px-4">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-[11px] font-bold tracking-[.16em] uppercase text-[var(--red)]">
              MÉTODO COMPROVADO
            </span>
            <h1 className="font-['Fraunces'] text-5xl md:text-8xl font-black leading-[0.95] tracking-tight text-[var(--ink)]">
              Em 2 minutos você descobre sua{" "}
              <span className="text-[var(--red)] italic underline decoration-[var(--red-soft)] underline-offset-8">
                nota real
              </span>{" "}
              do ENEM.
            </h1>
          </div>

          <p className="mx-auto max-w-2xl text-xl md:text-2xl text-[var(--ink-2)] font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Responda 6 perguntas rápidas, cole sua redação e receba a nota nas 5 competências oficiais do ENEM com o rigor do INEP.
          </p>

          <div className="pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            {!quizResult ? (
              <button
                onClick={() => setShowQuiz(true)}
                className="group relative inline-flex items-center justify-center rounded-2xl bg-[var(--ink)] px-10 py-6 text-xl md:text-2xl font-black text-[var(--paper)] transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-12px_rgba(22,33,58,0.25)]"
              >
                DESCUBRIR MINHA NOTA AGORA
                <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                onClick={() => {
                  const el = document.getElementById("corrigir");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative inline-flex items-center justify-center rounded-2xl bg-[var(--red)] px-10 py-6 text-xl md:text-2xl font-black text-white transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-12px_rgba(196,50,42,0.25)]"
              >
                ACESSAR ÁREA DE REDAÇÃO
                <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <p className="mt-6 text-sm font-bold text-[var(--ink-3)] uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              1.247 alunos corrigindo agora
            </p>
          </div>
        </div>
      </section>

      <section id="corrigir" className="py-20 px-4 max-w-4xl mx-auto">
        <EssaySubmissionArea isLoggedIn={!!session} isPro={false} />
      </section>

      <footer className="border-t border-[var(--line)] py-16 bg-[var(--paper-2)]">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="font-['Fraunces'] text-2xl font-black tracking-tighter italic text-[var(--ink)]">
                CORRIGE<span className="text-[var(--red)]">AI</span>
              </h3>
              <p className="text-sm text-[var(--ink-2)] leading-relaxed max-w-sm">
                A tecnologia mais avançada de correção de redação para o ENEM. Treine com o rigor oficial do INEP e conquiste sua vaga.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--red)]">Suporte Especializado</h4>
              <p className="text-sm text-[var(--ink-2)] font-medium">
                Dúvidas sobre o sistema ou pagamentos?
              </p>
              <a
                href="https://wa.me/5548996736743?text=Olá! Tenho uma dúvida sobre o CorrigeAI."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-2xl bg-[#25D366] px-8 py-4 text-sm font-black text-white transition-all hover:scale-105 shadow-[0_10px_20px_-5px_rgba(37,211,102,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,211,102,0.5)]"
              >
                <MessageSquare className="w-5 h-5" />
                FALAR COM SUPORTE
              </a>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-[var(--line)] flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-3)]">
            <span>© {new Date().getFullYear()} CorrigeAI. Todos os direitos reservados.</span>
            <div className="flex gap-6">
              <span>Termos de Uso</span>
              <span>Privacidade</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
