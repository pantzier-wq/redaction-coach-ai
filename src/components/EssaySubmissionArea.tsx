import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { corrigirRedacao, type Correcao } from "@/lib/correct-essay.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, Trophy } from "lucide-react";

interface EssaySubmissionAreaProps {
  isLoggedIn: boolean;
  onSuccess?: (result: Correcao) => void;
}

export function EssaySubmissionArea({ isLoggedIn, onSuccess }: EssaySubmissionAreaProps) {
  const [tema, setTema] = useState("");
  const [redacao, setRedacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [result, setResult] = useState<Correcao | null>(null);
  const [isPro, setIsPro] = useState(false);
  const corrigir = useServerFn(corrigirRedacao);

  const charCount = redacao.trim().length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setResult(null);
    setShowPaywall(false);
    setLoading(true);
    try {
      const startTime = Date.now();
      const r = await corrigir({ data: { tema: tema.trim(), redacao: redacao.trim() } });
      const elapsed = Date.now() - startTime;
      const wait = Math.max(0, 28000 - elapsed);
      
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }

      // Check if user is PRO.
      let currentIsPro = false;
      if (isLoggedIn) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("is_pro").eq("id", user.id).single();
          currentIsPro = !!profile?.is_pro;
          setIsPro(currentIsPro);
        }
      }

      setResult(r);
      if (isLoggedIn && !currentIsPro) {
        setShowPaywall(true);
      }
      
      if (isLoggedIn) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("essays").insert({
            user_id: user.id,
            tema: tema.trim(),
            redacao: redacao.trim(),
            resultado: r
          });
        }
      }

      if (onSuccess) {
        onSuccess(r);
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
    <div className="w-full">
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

          <p className="mt-8 text-xs font-bold text-foreground animate-pulse">
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
          <p className="mt-3 text-center text-xs font-bold text-foreground/70">
            🔒 100% privado • Sua redação {isLoggedIn ? "fica salva no seu histórico" : "não é armazenada"}
          </p>
        </form>
      )}

      {result && (
        <div className="relative">
          <div className={showPaywall ? "blur-md pointer-events-none select-none" : ""}>
            <Resultado data={result} isLoggedIn={isLoggedIn} />
          </div>
          
          {showPaywall && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <div 
                className="w-full max-w-2xl rounded-3xl border border-secondary/40 bg-card/90 backdrop-blur-xl p-8 md:p-12 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500"
              >
                <div className="mb-6 flex justify-center">
                  <div className="p-4 rounded-full bg-secondary/20 text-secondary animate-bounce">
                    <Trophy className="w-12 h-12" />
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Análise Pronta! 🎯</h2>
                
                <p className="text-lg text-foreground font-medium mb-8 leading-relaxed">
                  Sua correção detalhada e nota oficial já foram geradas. Mantemos esta plataforma ativa com uma pequena taxa de manutenção para que você possa continuar corrigindo suas redações com o máximo de precisão até o ENEM.
                </p>

                <div className="flex flex-col items-center gap-4">
                  <button
                    className="w-full rounded-2xl px-10 py-5 text-xl font-black text-secondary-foreground transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(var(--secondary-rgb),0.3)]"
                    style={{ background: "var(--gradient-secondary, linear-gradient(135deg, #f59e0b 0%, #d97706 100%))" }}
                  >
                    DESBLOQUEAR TUDO AGORA 🚀
                  </button>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-foreground">Acesso Vitalício por apenas <span className="text-secondary text-xl">R$ 24,90</span></p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Pagamento único • Sem mensalidade</p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left border-t border-border/50 pt-8">
                  <div className="flex gap-3 items-center">
                    <div className="h-2 w-2 rounded-full bg-secondary shrink-0" />
                    <p className="text-xs font-bold">Correções <strong>ilimitadas</strong></p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="h-2 w-2 rounded-full bg-secondary shrink-0" />
                    <p className="text-xs font-bold">Histórico VIP permanente</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Resultado({ data, isLoggedIn }: { data: Correcao; isLoggedIn: boolean }) {
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
      
      {!isLoggedIn && (
        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary animate-pulse" />
          <h3 className="text-2xl font-black mb-2">Quer chegar nos 1000? 🚀</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Esta foi apenas sua correção gratuita. Membros <strong className="text-primary italic">VIP</strong> têm acesso ao histórico de redações corrigidas e podem adquirir o <strong className="text-secondary">Plano Vitalício (R$ 24,90)</strong> para correções ilimitadas e guias exclusivos.
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
      )}
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
