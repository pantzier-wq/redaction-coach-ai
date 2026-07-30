import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

function Countdown() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <div className="h-[68px]" />;

  const year = now.getFullYear();
  const nov = new Date(year, 10, 1);
  const firstSun = new Date(year, 10, 1 + ((7 - nov.getDay()) % 7));
  const target =
    now > firstSun
      ? new Date(year + 1, 10, 1 + ((7 - new Date(year + 1, 10, 1).getDay()) % 7))
      : firstSun;
  const diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const Box = ({ v, l }: { v: number; l: string }) => (
    <div className="flex min-w-16 flex-col items-center rounded-xl border border-border bg-card px-3 py-2">
      <span className="text-2xl md:text-3xl font-black tabular-nums text-primary">
        {String(v).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
    </div>
  );
  return (
    <div className="flex justify-center gap-2">
      <Box v={d} l="dias" /> <Box v={h} l="hrs" /> <Box v={m} l="min" /> <Box v={s} l="seg" />
    </div>
  );
}


function Landing() {
  const [session, setSession] = useState<any>(null);

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

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary bg-secondary/20 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(var(--secondary-rgb),0.3)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-secondary shadow-[0_0_8px_#ff4d4d]" />
            ENEM está chegando — não dá mais pra enrolar
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
            Sua redação zerada no ENEM vai{" "}
            <span
              style={{
                background: "var(--gradient-hero)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              destruir
            </span>{" "}
            o sonho da faculdade.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg md:text-xl text-muted-foreground">
            A <strong className="text-foreground">CorrigeAI</strong> corrige sua redação em{" "}
            <strong className="text-primary">30 segundos</strong>, nas 5 competências oficiais, com
            o mesmo rigor dos corretores do INEP. Descubra AGORA o que está te separando dos 1000.
          </p>

          <div className="mt-8 mb-4">
            <Countdown />
            <p className="mt-2 text-xs font-bold text-foreground">⏳ Tempo até o próximo ENEM</p>
          </div>

          <a
            href="#corrigir"
            className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-black text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
          >
            CORRIGIR MINHA REDAÇÃO AGORA →
          </a>
          <p className="mt-3 text-xs font-bold text-foreground/80">
            Grátis • Sem cadastro • Resultado em segundos
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "😰", d: "Você escreve, escreve… e não faz ideia se tá bom ou vai zerar." },
            { t: "⏰", d: "Faltam semanas. Professor não vai corrigir 20 redações suas a tempo." },
            { t: "💸", d: "Cursinho cobra R$150 por correção. Você precisa de 10, no mínimo." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 text-3xl">{x.t}</div>
              <p className="text-sm text-card-foreground">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xl md:text-2xl font-bold">
          Enquanto você <span className="text-destructive">adia</span>, seu concorrente já corrigiu
          15 redações essa semana.
        </p>
      </section>

      <section id="corrigir" className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-block rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            A solução chegou
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            Cole sua redação. Receba sua nota. Agora.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Correção completa nas 5 competências do INEP em segundos.
          </p>
        </div>

        <EssaySubmissionArea isLoggedIn={!!session} />
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { 
              n: "+12.400", 
              l: "redações corrigidas", 
              icon: "📊",
              color: "from-primary/20 to-transparent"
            },
            { 
              n: "5 comp.", 
              l: "matriz oficial INEP", 
              icon: "⚖️",
              color: "from-secondary/20 to-transparent"
            },
            { 
              n: "30s", 
              l: "tempo médio de correção", 
              icon: "⚡",
              color: "from-accent/20 to-transparent"
            },
          ].map((s, i) => (
            <div 
              key={s.l} 
              className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center transition-all hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)] group"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${s.color} opacity-50`} />
              <div className="relative z-10">
                <div className="mb-4 text-4xl transform transition-transform group-hover:scale-110 duration-300">
                  {s.icon}
                </div>
                <div className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
                  {s.n}
                </div>
                <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-foreground/70 group-hover:text-foreground transition-colors">
                  {s.l}
                </div>
              </div>
              
              {/* Decorative corner glow */}
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl md:text-4xl font-black">Quem já usou, aprovou.</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              name: "Lucas Martins",
              text: "Consegui subir de 720 para 960 em duas semanas. As correções detalhadas são o diferencial.",
              note: "960 no Simulado",
              image: "https://i.imgur.com/5anryL8.png",
            },
            {
              name: "Ana Julia",
              text: "O feedback da competência 5 me ajudou a entender o que faltava na minha proposta. Incrível!",
              note: "Nota 920",
              image: "https://i.imgur.com/5BdwE3A.png",
            },
            {
              name: "Matheus Oliveira",
              text: "Tava desesperado ano passado quando faltava 1 mês. A IA me mostrou que eu tava errando a estrutura da introdução. Salvou demais!",
              note: "Evolução Real",
              image: "https://i.imgur.com/1UzcSfp.png",
            },
            {
              name: "Beatriz Santos",
              text: "Melhor que muito corretor humano que demora uma semana pra entregar. O feedback é instantâneo e certeiro.",
              note: "100% Satisfeita",
              image: "https://i.imgur.com/FBKCxCS.png",
            },
            {
              name: "Carolina Ribeiro",
              text: "Eu sempre achava que minha conclusão tava boa, mas a IA mostrou que eu esquecia o agente e o meio na proposta. Corrigi isso e minha nota subiu quase 100 pontos no último simulado.",
              note: "Passou em Enfermagem",
              image: depoimentoCarolina,
            },

          ].map((p, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="mb-4 h-16 w-16 overflow-hidden rounded-full bg-muted border-2 border-primary/20">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground/40 font-bold uppercase">
                    {p.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="mb-2 flex items-center gap-1 text-primary">
                {"★".repeat(5)}
              </div>
              <p className="mb-4 text-sm italic text-card-foreground">"{p.text}"</p>
              <div className="flex w-full items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-bold">{p.name}</span>
                <span className="text-xs font-semibold text-primary">{p.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl md:text-4xl font-black">Dúvidas Frequentes</h2>
        <div className="space-y-4">
          {[
            {
              q: "A nota é igual à do ENEM?",
              a: "Nossa IA foi treinada com a matriz oficial de 2024. A nota é uma estimativa ultra-precisa baseada nos mesmos critérios do INEP.",
            },

            {
              q: "A IA entende qualquer tema?",
              a: "Sim! Nossa tecnologia processa qualquer tema possível para o ENEM, analisando estrutura, repertório e projeto de texto com profundidade.",
            },
            {
              q: "A correção demora muito?",
              a: "Não! Em média, em 30 segundos você recebe o relatório completo. Chega de esperar uma semana pela correção do professor.",
            },
            {
              q: "Preciso enviar a redação digitada?",
              a: "Sim, basta colar o texto na área de análise. Em segundos a IA lê tudo e devolve o relatório completo por competência.",
            },
            {
              q: "Vou receber sugestões de melhoria?",
              a: "Com certeza. Além da nota por competência, a IA indica exatamente onde você errou e como pode melhorar para subir sua pontuação.",
            },
            {
              q: "O acesso é vitalício?",
              a: "Sim! Ao adquirir nossos planos de manutenção, você garante acesso às ferramentas para treinar quantas vezes precisar até o dia da prova.",
            },
          ].map((f, i) => (
            <details key={i} className="group rounded-xl border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-bold text-foreground transition-colors hover:bg-muted/50">
                {f.q}
                <span className="text-primary transition-transform group-open:rotate-180">↓</span>
              </summary>
              <div className="p-4 pt-0 text-sm text-muted-foreground border-t border-border/50 mt-2">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-black leading-tight">
          Ou você{" "}
          <span className="text-primary underline decoration-primary/40 decoration-4 underline-offset-4">
            corrige agora
          </span>
          . Ou{" "}
          <span className="text-destructive">chora no resultado</span>.
        </h2>

        <p className="mt-3 text-muted-foreground">
          A escolha é literalmente sua. E o tempo tá acabando.
        </p>
        <a
          href="#corrigir"
          className="mt-6 inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-black text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
        >
          QUERO MINHA CORREÇÃO GRÁTIS →
        </a>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CorrigeAI — feito para quem não pode mais perder tempo.
      </footer>
    </div>
  );
}

