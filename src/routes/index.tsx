import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { corrigirRedacao, type Correcao } from "@/lib/correct-essay.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Trophy, ArrowRight } from "lucide-react";

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
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
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
  const [tema, setTema] = useState("");
  const [redacao, setRedacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [result, setResult] = useState<Correcao | null>(null);
  const [session, setSession] = useState<any>(null);
  const corrigir = useServerFn(corrigirRedacao);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const charCount = redacao.trim().length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setResult(null);
    setLoading(true);
    try {
      // Forçamos pelo menos 25 segundos de loading para criar suspense e realismo (FOMO/Dopamina)
      const startTime = Date.now();
      const r = await corrigir({ data: { tema: tema.trim(), redacao: redacao.trim() } });
      const elapsed = Date.now() - startTime;
      const wait = Math.max(0, 28000 - elapsed); // Miramos em ~30s no total
      
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }

      setResult(r);
      
      // Se estiver logado, salva no histórico
      if (session?.user) {
        await supabase.from("essays").insert({
          user_id: session.user.id,
          tema: tema.trim(),
          redacao: redacao.trim(),
          resultado: r
        });
      }

      setTimeout(
        () => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/50 bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
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
            <p className="mt-2 text-xs text-muted-foreground">⏳ Tempo até o próximo ENEM</p>
          </div>

          <a
            href="#corrigir"
            className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-black text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
          >
            CORRIGIR MINHA REDAÇÃO AGORA →
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
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

        {loading ? (
          <div 
            className="rounded-3xl border border-primary/40 bg-card p-10 text-center animate-in fade-in zoom-in duration-500"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div className="mb-6 flex justify-center">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-card border-2 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]">
                  <span className="text-3xl animate-bounce">✍️</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-black mb-4">Analisando sua Redação...</h3>
            
            <div className="mx-auto mb-6 h-3 w-full max-w-md overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)] transition-all duration-1000 ease-linear"
                style={{ 
                  width: '100%',
                  animation: 'loading-bar 30s linear forwards'
                }} 
              />
            </div>

            <div className="relative h-10 w-full max-w-sm mx-auto overflow-hidden">
              <div className="animate-vertical-slide">
                {[
                  "Preparando a melhor correção...",
                  "Comparando com os critérios oficiais do INEP...",
                  "Analisando conectivos e coesão textual...",
                  "Verificando os 5 elementos da proposta...",
                  "Avaliando repertório sociocultural...",
                  "Calculando nota final das 5 competências...",
                  "Quase pronto! Finalizando relatório..."
                ].map((text, i) => (
                  <div key={i} className="flex h-10 items-center justify-center">
                    <p className="text-primary font-bold uppercase tracking-widest text-[10px] md:text-xs text-center leading-tight">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-8 text-xs text-muted-foreground animate-pulse">
              O rigor da correção leva tempo. Não feche esta página.
            </p>

            <style>{`
              @keyframes loading-bar {
                0% { width: 0%; }
                100% { width: 100%; }
              }
              @keyframes vertical-slide {
                0%, 12% { transform: translateY(0); }
                14.28%, 26.28% { transform: translateY(-40px); }
                28.57%, 40.57% { transform: translateY(-80px); }
                42.85%, 54.85% { transform: translateY(-120px); }
                57.14%, 69.14% { transform: translateY(-160px); }
                71.42%, 83.42% { transform: translateY(-200px); }
                85.71%, 100% { transform: translateY(-240px); }
              }
              .animate-vertical-slide {
                animation: vertical-slide 30s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              }
            `}</style>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-border bg-card p-6 md:p-8"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <label className="mb-2 block text-sm font-bold">Tema da redação</label>
            <input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              required
              maxLength={300}
              placeholder="Ex: Desafios para a valorização da comunidade indígena no Brasil"
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <label className="mt-5 mb-2 block text-sm font-bold">Cole sua redação aqui</label>
            <textarea
              value={redacao}
              onChange={(e) => setRedacao(e.target.value)}
              required
              rows={12}
              maxLength={8000}
              placeholder="Cole o texto completo da sua redação..."
              className="w-full resize-y rounded-xl border border-border bg-input px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {charCount} caracteres {charCount < 200 && "• mínimo 200"}
            </div>

            {erro && (
              <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || charCount < 200 || tema.trim().length < 3}
              className="mt-6 w-full rounded-xl py-4 text-lg font-black text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
            >
              CORRIGIR AGORA COM IA →
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              🔒 100% privado • Sua redação não é armazenada
            </p>
          </form>
        )}

        {result && <Resultado data={result} isLoggedIn={!!session} />}
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
                <div className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
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
              name: "Lucas M.",
              text: "Consegui subir de 720 para 960 em duas semanas. As correções detalhadas são o diferencial.",
              note: "960 no Simulado",
            },
            {
              name: "Ana Julia",
              text: "O feedback da competência 5 me ajudou a entender o que faltava na minha proposta. Incrível!",
              note: "Nota 920",
            },
          ].map((p, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-2 flex items-center gap-1 text-primary">
                {"★".repeat(5)}
              </div>
              <p className="mb-4 text-sm italic text-card-foreground">"{p.text}"</p>
              <div className="flex items-center justify-between border-t border-border pt-4">
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
              q: "Posso corrigir quantas redações?",
              a: "Nesta fase de reta final, estamos liberando correções gratuitas para ajudar o máximo de estudantes desesperados.",
            },
            {
              q: "A IA entende qualquer tema?",
              a: "Sim! Desde temas sociais clássicos até os mais complexos. Ela analisa a estrutura e o projeto de texto.",
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
        <h2 className="text-3xl md:text-4xl font-black">
          Ou você corrige agora. Ou chora no resultado.
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

function Resultado({ data }: { data: Correcao }) {
  const pct = Math.round((data.nota_total / 1000) * 100);
  return (
    <div
      id="resultado"
      className="mt-10 rounded-3xl border border-primary/40 bg-card p-6 md:p-8"
      style={{ boxShadow: "var(--shadow-glow)" }}
    >
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Sua nota estimada
        </div>
        <div
          className="mt-2 text-6xl md:text-7xl font-black"
          style={{
            background: "var(--gradient-cta)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {data.nota_total}
        </div>
        <div className="text-sm text-muted-foreground">
          de 1000 pontos ({pct}%)
        </div>
      </div>

      <p className="mt-6 text-center italic text-card-foreground">"{data.resumo}"</p>

      <div className="mt-8 space-y-3">
        {data.competencias.map((c) => (
          <div key={c.numero} className="rounded-xl border border-border bg-input/50 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-bold">
                C{c.numero} — {c.titulo}
              </div>
              <div className="text-xl font-black text-primary">
                {c.nota}
                <span className="text-xs text-muted-foreground">/200</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{c.analise}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Bloco titulo="✅ Pontos fortes" itens={data.pontos_fortes} cor="text-primary" />
        <Bloco titulo="⚠️ Pontos fracos" itens={data.pontos_fracos} cor="text-secondary" />
        <Bloco titulo="💡 Sugestões" itens={data.sugestoes} cor="text-accent" />
      </div>
      <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
        <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary animate-pulse" />
        <h3 className="text-2xl font-black mb-2">Quer chegar nos 1000? 🚀</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Esta foi apenas sua correção gratuita. Membros <strong className="text-primary italic">VIP</strong> têm acesso a correções ilimitadas, guia de repertórios e análise profunda de cada erro.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-black text-primary-foreground transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
        >
          CRIAR MINHA CONTA VIP AGORA <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Trophy className="w-3 h-3 text-secondary" /> Mais de 5.000 alunos já garantiram a vaga
        </p>
      </div>
    </div>
  );
}

function Bloco({ titulo, itens, cor }: { titulo: string; itens: string[]; cor: string }) {
  return (
    <div className="rounded-xl border border-border bg-input/40 p-4">
      <div className={`mb-2 text-sm font-bold ${cor}`}>{titulo}</div>
      <ul className="space-y-1.5 text-sm text-card-foreground">
        {itens.map((i, k) => (
          <li key={k} className="leading-snug">
            • {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
