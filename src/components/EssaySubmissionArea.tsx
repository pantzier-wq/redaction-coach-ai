import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { corrigirRedacao, type Correcao } from "@/lib/correct-essay.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, Trophy, Zap } from "lucide-react";

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
  
  // Efeito para carregar redação do histórico se houver no localStorage
  useState(() => {
    const saved = localStorage.getItem("viewing_essay");
    if (saved) {
      try {
        const essay = JSON.parse(saved);
        setTema(essay.tema);
        setRedacao(essay.redacao);
        setResult(essay.resultado);
        // Limpar após carregar
        localStorage.removeItem("viewing_essay");
      } catch (e) {
        console.error("Erro ao carregar redação salva", e);
      }
    }
  });

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

      setResult(r);

      // Persistência local para usuários não logados (Primeira correção gratuita)
      if (!isLoggedIn) {
        localStorage.setItem("pending_essay_correction", JSON.stringify({
          tema: tema.trim(),
          redacao: redacao.trim(),
          resultado: r,
          timestamp: Date.now()
        }));
      }

      // Check if user is PRO.
      let currentIsPro = false;
      if (isLoggedIn) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("is_pro").eq("id", user.id).single();
          currentIsPro = !!profile?.is_pro;
          setIsPro(currentIsPro);
          
          // Se logado, salvar no banco
          await supabase.from("essays").insert({
            user_id: user.id,
            tema: tema.trim(),
            redacao: redacao.trim(),
            resultado: r
          });
        }
      }

      if (isLoggedIn && !currentIsPro) {
        setShowPaywall(true);
      }
      
      // Automatic scroll to results for free tier on first correction
      if (!isLoggedIn) {
        setTimeout(
          () => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      }
      
      if (onSuccess) {
        onSuccess(r);
      }

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
        <div className="relative w-full">
          <form
            onSubmit={onSubmit}
            className={`rounded-3xl border border-border bg-card p-6 md:p-8 transition-all duration-500 overflow-hidden ${result && showPaywall ? "blur-2xl opacity-20 pointer-events-none scale-95" : ""}`}
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <label className="mb-2 block text-sm font-bold text-primary">Tema da redação</label>
            <input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              required
              maxLength={300}
              placeholder="Ex: Desafios para a valorização da comunidade indígena no Brasil"
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <label className="mt-5 mb-2 block text-sm font-bold text-primary">Cole sua redação aqui</label>
            <textarea
              value={redacao}
              onChange={(e) => setRedacao(e.target.value)}
              required
              rows={12}
              maxLength={8000}
              placeholder="Cole o texto completo da sua redação..."
              className="w-full resize-y rounded-xl border border-border bg-input px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="mt-6 w-full rounded-xl py-4 text-lg font-black text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", boxShadow: "0 0 20px rgba(34, 197, 94, 0.4)" }}
            >
              CORRIGIR AGORA COM IA →
            </button>
            <p className="mt-3 text-center text-xs font-bold text-muted-foreground">
              🔒 100% privado • Sua redação {isLoggedIn ? "fica salva no seu histórico" : "não é armazenada"}
            </p>
          </form>

          {result && showPaywall && (
            <div className="absolute inset-0 z-50 flex items-start justify-center p-4 md:p-6 pt-16 md:pt-20">
              <div 
                className="w-full max-w-lg rounded-3xl border border-[#22c55e]/50 bg-card/95 p-6 md:p-10 shadow-[0_0_100px_rgba(34,197,94,0.4)] backdrop-blur-2xl relative my-8 animate-in fade-in zoom-in duration-500"
              >
                <div className="absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2 z-10">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-[#22c55e]/20" />
                    <div className="relative p-5 rounded-full bg-card text-[#22c55e] border-4 border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.6)]">
                      <Trophy className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black mb-4 mt-4 tracking-tighter uppercase italic text-center text-white">Análise Pronta! 🎯</h2>
                
                <p className="text-sm md:text-base text-white/90 font-semibold mb-6 md:mb-8 leading-relaxed text-center">
                  Sua correção detalhada e nota oficial já foram geradas com precisão INEP. <br className="hidden md:block"/>
                  <span className="text-[#22c55e]">Desbloqueie agora</span> para ver seu resultado completo e garantir sua vaga na faculdade.
                </p>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <button
                      className="group relative w-full overflow-hidden rounded-2xl px-6 py-4 md:py-5 text-lg md:text-xl font-black text-white transition-all hover:scale-[1.03] active:scale-95 shadow-[0_10px_40px_rgba(34,197,94,0.4)]"
                      style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}
                    >
                      <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                      <span className="relative flex items-center justify-center gap-3 text-sm md:text-base">
                        LIBERAR ACESSO VITALÍCIO • R$ 24,90 <ArrowRight className="w-5 h-5 animate-pulse" />
                      </span>
                    </button>

                    <button
                      className="group relative w-full overflow-hidden rounded-2xl px-6 py-4 md:py-5 text-lg md:text-xl font-black text-white transition-all hover:scale-[1.03] active:scale-95 shadow-[0_10px_40px_rgba(var(--primary-rgb),0.4)] border-2 border-primary"
                      style={{ background: "rgba(var(--primary-rgb), 0.1)" }}
                    >
                      <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                      <span className="relative flex flex-col items-center justify-center gap-0 text-primary">
                        <span className="text-xs uppercase tracking-tighter opacity-80">🔥 Combo Nota 1000 (Tudo Incluso) 🔥</span>
                        <span className="flex items-center gap-2">
                          GARANTIR TUDO POR R$ 42,00 <Sparkles className="w-5 h-5" />
                        </span>
                      </span>
                    </button>
                    
                    <div className="flex flex-col gap-2 text-center pt-2">
                      <p className="text-[10px] text-white font-black uppercase tracking-widest bg-white/5 py-1 rounded-lg">
                        Liberação Imediata • Pagamento Único
                      </p>
                      <p className="text-[9px] text-white/60 uppercase tracking-[0.2em] font-black">Sem mensalidades • Sem letras miúdas</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 md:mt-10 space-y-4 border-t border-border/50 pt-6 md:pt-8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#22c55e]/60">Compare os Planos:</p>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black animate-pulse">MELHOR ESCOLHA</span>
                  </div>
                  
                  {/* BUNDLE OPTION - HIGHLIGHTED */}
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                      <p className="text-xs font-black text-white flex items-center gap-2">
                        <Zap className="w-3 h-3 text-[#22c55e]" /> ACESSO VITALÍCIO (R$ 24,90)
                      </p>
                      <ul className="mt-2 space-y-1">
                        <li className="text-[10px] text-white/70 flex items-center gap-2">✓ Correções de redação ilimitadas</li>
                        <li className="text-[10px] text-white/70 flex items-center gap-2">✓ Histórico completo salvo</li>
                      </ul>
                    </div>

                    <button className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-primary bg-primary/5 text-left hover:bg-primary/10 transition-all hover:scale-[1.02] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-tighter rounded-bl-xl">MAIS COMPLETO</div>
                      <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black leading-tight text-white group-hover:text-primary transition-colors">COMBO NOTA 1000</p>
                        <p className="text-[9px] font-medium text-white/70 mt-1">Vitalício + Todos os 4 Materiais Digitais</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-white/50 line-through">R$ 73,50</span>
                          <span className="text-lg font-black text-primary">R$ 42,00</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-80">
                    <button className="flex items-center gap-3 p-3 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 text-left hover:bg-[#22c55e]/10 transition-colors group">
                      <div className="h-8 w-8 rounded-lg bg-[#22c55e]/20 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-[#22c55e]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black leading-tight text-white group-hover:text-[#22c55e] transition-colors">Guia de Repertórios Coringa</p>
                        <p className="text-[8px] font-medium text-white/70 mt-0.5">+ 70 repertórios universais (Todos os temas)</p>
                        <p className="text-[9px] font-bold text-[#22c55e]">+ R$ 12,90</p>
                      </div>
                    </button>

                    <button className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 text-left hover:bg-white/10 transition-colors group">
                      <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-white/50" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black leading-tight text-white/70 group-hover:text-white transition-colors">Flashcards de Conectivos</p>
                        <p className="text-[8px] font-medium text-white/50 mt-0.5">Domine a C4 (Pontes lógicas e coesão)</p>
                        <p className="text-[9px] font-bold text-white/50">+ R$ 12,90</p>
                      </div>
                    </button>

                    <button className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 text-left hover:bg-white/10 transition-colors group">
                      <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-white/50" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black leading-tight text-white/70 group-hover:text-white transition-colors">Manual Proposta Nota 200</p>
                        <p className="text-[8px] font-medium text-white/50 mt-0.5">Checklist dos 5 elementos obrigatórios (C5)</p>
                        <p className="text-[9px] font-bold text-white/50">+ R$ 12,90</p>
                      </div>
                    </button>

                    <button className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 text-left hover:bg-white/10 transition-colors group">
                      <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-white/50" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black leading-tight text-white/70 group-hover:text-white transition-colors">Checklist Introdução 10/10</p>
                        <p className="text-[8px] font-medium text-white/50 mt-0.5">Estrutura de impacto p/ começar sem travar</p>
                        <p className="text-[9px] font-bold text-white/50">+ R$ 9,90</p>
                      </div>
                    </button>
                  </div>
                </div>
                
                <p className="mt-8 text-[10px] font-bold text-white/50 flex items-center justify-center gap-2">
                  🔒 Compra 100% segura e garantida
                </p>
              </div>
            </div>
          )}

          {result && !showPaywall && (
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <Resultado data={result} isLoggedIn={isLoggedIn} />
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
        <Bloco titulo="⚠️ Pontos fracos" itens={data.pontos_fracos} cor="text-white font-bold" extraItemClass="text-white font-bold" />
        <Bloco titulo="💡 Sugestões" itens={data.sugestoes} cor="text-white font-bold" extraItemClass="text-white font-bold" />
      </div>
      
      {!isLoggedIn && (
        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary animate-pulse" />
          <h3 className="text-2xl font-black mb-2">Gostou da correção? 🚀</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Salve esse resultado e continue treinando para alcançar a <strong className="text-primary italic">Nota 1000</strong>. Crie sua conta gratuita agora para salvar seu progresso e ter acesso a ferramentas exclusivas de estudo.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-black text-primary-foreground transition-all hover:scale-105 active:scale-95"
            style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
          >
            CRIAR MINHA CONTA AGORA <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Trophy className="w-3 h-3 text-secondary" /> Mais de 5.000 alunos já estão treinando conosco
          </p>
        </div>
      )}
    </div>
  );
}

function Bloco({ titulo, itens, cor, extraItemClass = "" }: { titulo: string; itens: string[]; cor: string; extraItemClass?: string }) {
  return (
    <div className="rounded-xl border border-border bg-input/40 p-4">
      <div className={`mb-2 text-sm font-bold ${cor}`}>{titulo}</div>
      <ul className={`space-y-1.5 text-sm ${extraItemClass || "text-card-foreground"}`}>
        {itens.map((i, k) => (
          <li key={k} className="leading-snug">
            • {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
