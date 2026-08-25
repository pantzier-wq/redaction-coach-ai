import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { corrigirRedacao, type Correcao } from "@/lib/correct-essay.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, Trophy, Zap, CheckCircle2 } from "lucide-react";
import { goToCheckout, goToCreditsCheckout } from "@/lib/checkout";
import { CouponUnlockedBanner } from "@/components/CouponUnlockedBanner";


interface EssaySubmissionAreaProps {
  isLoggedIn: boolean;
  isPro?: boolean;
  onSuccess?: (result: Correcao) => void;
  showEssayForm?: boolean;
  onContinue?: () => void;
}

function Step({ text, delay, isLast }: { text: string; delay: number; isLast?: boolean }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
      <span className={`text-sm font-medium ${isLast ? 'text-[var(--red)] font-bold italic' : 'text-[var(--ink-2)]'}`}>
        {text}
      </span>
    </div>
  );
}

const LIMITE_ESSENCIAL = 15;

export function EssaySubmissionArea({ isLoggedIn, isPro: propIsPro, onSuccess, showEssayForm = true, onContinue }: EssaySubmissionAreaProps) {
  const [tema, setTema] = useState("");
  const [redacao, setRedacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [result, setResult] = useState<Correcao | null>(null);
  const [isPro, setIsPro] = useState(propIsPro || false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [credits, setCredits] = useState(0);
  const [timeUntilExam, setTimeUntilExam] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const corrigir = useServerFn(corrigirRedacao);

  useEffect(() => {
    const examDate = new Date("2026-11-08T00:00:00").getTime();
    const updateCountdown = () => {
      const remaining = Math.max(0, examDate - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      setTimeUntilExam({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Carrega plano/créditos do usuário logado
  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro, has_full_access, credits")
        .eq("id", user.id)
        .single();
      if (!active || !profile) return;
      setIsPro(!!profile.is_pro);
      setHasFullAccess(!!(profile as any).has_full_access);
      setCredits((profile as any).credits ?? 0);
    })();
    return () => { active = false; };
  }, [isLoggedIn]);
  
  // Efeito para carregar redação do histórico se houver no localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("viewing_essay");
    const pendingData = window.localStorage.getItem("pending_essay_data");
    
    if (saved) {
      try {
        const essay = JSON.parse(saved);
        setTema(essay.tema);
        setRedacao(essay.redacao);
        setResult(essay.resultado);
        window.localStorage.removeItem("viewing_essay");
      } catch (e) {
        console.error("Erro ao carregar redação salva", e);
      }
    } else if (pendingData) {
      try {
        const data = JSON.parse(pendingData);
        setTema(data.tema);
        setRedacao(data.redacao);
        window.localStorage.removeItem("pending_essay_data");
      } catch (e) {
        console.error("Erro ao carregar dados pendentes", e);
      }
    }
  }, []);

  const charCount = redacao.trim().length;
  // Combo = ilimitado. Essencial = precisa de créditos disponíveis.
  const canCorrect = hasFullAccess || (isPro && credits > 0);
  const semCreditos = isPro && !hasFullAccess && credits <= 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErro(null);
    setResult(null);
    setShowPaywall(false);

    // Salva a redação para processar depois do diagnóstico (se necessário)
    localStorage.setItem("pending_submission", JSON.stringify({ tema, redacao }));

    // Se o usuário não estiver logado e ainda não viu o diagnóstico do quiz, 
    // ou se estamos seguindo o novo fluxo de "Quiz -> Diagnóstico -> Redação -> Paywall"
    const quizAnswers = localStorage.getItem("quiz_answers");
    if (!isLoggedIn && quizAnswers) {
      setLoading(true);
      
      // Simula a correção mas não faz a chamada pesada da IA se for apenas para mostrar o paywall parcial
      // No fluxo anônimo, mostramos a nota (mockada ou real dependendo da necessidade de retenção)
      // O usuário quer ver a Nota Total + C1. Para ser "real", precisamos da IA.
      
      try {
        const fingerprint = localStorage.getItem("visitor_fingerprint") || crypto.randomUUID();
        localStorage.setItem("visitor_fingerprint", fingerprint);

        const r = await corrigir({ 
          data: { 
            tema: tema.trim(), 
            redacao: redacao.trim(),
            fingerprint,
            accessToken: undefined
          } 
        });
        
        const correctionData = r.correcao || r;
        setResult(correctionData);
        setShowPaywall(true);
      } catch (err) {
        console.error("Erro no fluxo anônimo:", err);
      } finally {
        setLoading(false);
      }
      
      setTimeout(
        () => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
      return;
    }

    if (isLoggedIn && !canCorrect) {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const r = await corrigir({ 
          data: { 
            tema: tema.trim(), 
            redacao: redacao.trim(),
            accessToken: session?.access_token
          } 
        });
        const correctionData = r.correcao || r;
        setResult(correctionData);
        setShowPaywall(true);
      } catch (err) {
        console.error("Erro no fluxo logado sem crédito:", err);
      } finally {
        setLoading(false);
      }
      setTimeout(
        () => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
      return;
    }


    setLoading(true);

    try {
      const startTime = Date.now();


      
      // Gera ou recupera fingerprint para visitantes anônimos
      let fingerprint = "";
      let accessToken: string | undefined;
      if (!isLoggedIn) {
        fingerprint = localStorage.getItem("visitor_fingerprint") || "";
        if (!fingerprint) {
          fingerprint = crypto.randomUUID();
          localStorage.setItem("visitor_fingerprint", fingerprint);
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token;
      }

      // A lógica de créditos e IA agora está 100% centralizada no servidor (corrigirRedacao)
      const r = await corrigir({ 
        data: { 
          tema: tema.trim(), 
          redacao: redacao.trim(),
          fingerprint,
          accessToken
        } 
      });

      
      const elapsed = Date.now() - startTime;
      const wait = Math.max(0, 28000 - elapsed);

      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }

      // r já vem como objeto se o servidor retornar direto
      const correctionData = r.correcao || r;
      setResult(correctionData);
      
      // Rola para o resultado após o delay de carregamento
      setTimeout(() => {
        document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Sincroniza saldo e status após a correção
      let stillAllowed = false;
      if (isLoggedIn) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_pro, has_full_access, credits")
            .eq("id", user.id)
            .single();

          if (profile) {
            const pro = !!profile.is_pro;
            const full = !!(profile as any).has_full_access;
            const saldo = (profile as any).credits ?? 0;
            setIsPro(pro);
            setHasFullAccess(full);
            setCredits(saldo);
            stillAllowed = full || (pro && saldo > 0);
          }
        }
      }

      // NOVO FLUXO: Sempre mostra paywall se não for PRO, mesmo após a primeira correção.
      // A primeira correção agora é "bloqueada" até o pagamento.
      if (!isLoggedIn || !stillAllowed) {
        setShowPaywall(true);
        setTimeout(
          () => document.getElementById("paywall-anchor")?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      } else {
        setShowPaywall(false);
      }
      
      
      if (onSuccess) {
        onSuccess(correctionData);
      }

    } catch (err: any) {
      console.error("Erro na submissão:", err);
      
      const errMsg = err.message || "";
      console.error("DEBUG UI ERROR:", errMsg);
      const semAcesso =
        errMsg.includes("LIMITE_EXCEDIDO") ||
        errMsg.includes("créditos suficientes") ||
        errMsg.includes("CRÉDITOS_INSUFICIENTES") ||
        errMsg.includes("insufficient_credits") ||
        errMsg.includes("correção gratuita") ||
        errMsg.includes("créditos");
      // Usuário logado sem plano/créditos deve ver as ofertas, nunca um erro genérico.
      if (semAcesso || (isLoggedIn && !canCorrect)) {
        setShowPaywall(true);
        setErro(null);
      } else {
        // Remove prefixos técnicos (IA_INDISPONIVEL:, IA_OCUPADA:) antes de exibir
        setErro(errMsg.replace(/^IA_(INDISPONIVEL|OCUPADA):\s*/, "") || "Não foi possível concluir a análise. Tente novamente.");
      }

    } finally {
      setLoading(false);
    }
  }


  // type: 'basic' = Plano Essencial (15 correções) | 'combo' = vitalício ilimitado
  async function handleTestPurchase(type: "basic" | "combo" = "basic") {
    // Redireciona para o checkout real (Cakto). A liberação acontece após o pagamento.
    await goToCheckout(type === "combo" ? "combo" : "essencial");
  }


  // Compra de créditos avulsos (somente para quem já tem o Plano Essencial)
  async function handleBuyCredits(qtd: number) {
    // Redireciona para o checkout real da recarga (Cakto).
    await goToCreditsCheckout(qtd);
  }



  return (
    <div className="w-full space-y-8">
      {result && !loading && (
        <Resultado 
          data={result} 
          isLoggedIn={isLoggedIn} 
          showPaywall={showPaywall}
          onShowAll={() => {
            const el = document.getElementById("paywall-anchor");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}

      <div className="w-full">
        {loading ? (
          <div 
            className="rounded-3xl border border-[var(--red)] bg-[var(--paper)] p-10 text-center animate-in fade-in zoom-in duration-500"
            style={{ boxShadow: "var(--paper-shadow)" }}
          >
            <div className="mb-6 flex justify-center">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 animate-ping rounded-full bg-[var(--red)]/20" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[var(--paper)] border-2 border-[var(--red)] shadow-[0_0_20px_rgba(196,50,42,0.3)]">
                  <span className="text-3xl animate-bounce">✍️</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-['Fraunces'] font-black mb-4 text-[var(--ink)]">Análise rodando...</h3>
            
            <div className="mx-auto mb-6 h-3 w-full max-w-md overflow-hidden rounded-full bg-[var(--paper-2)] border border-[var(--line)]">
              <div 
                className="h-full bg-[var(--red)] shadow-[0_0_15px_rgba(196,50,42,0.4)] transition-all duration-1000 ease-linear"
                style={{ 
                  width: '100%',
                  animation: 'loading-bar 30s linear forwards'
                }} 
              />
            </div>

            <div className="relative h-64 w-full max-w-sm mx-auto overflow-hidden text-left border border-[var(--line)] p-4 rounded-xl bg-[var(--paper-2)]/50">
              <div className="space-y-3">
                <Step text={`✓ Lendo sua redação — ${redacao.split(/\s+/).filter(Boolean).length} palavras`} delay={1} />
                <Step text="✓ Competência 1 · domínio da norma culta" delay={5} />
                <Step text="✓ Competência 2 · compreensão do tema" delay={9} />
                <Step text="✓ Competência 3 · organização dos argumentos" delay={13} />
                <Step text="✓ Competência 4 · coesão e conectivos" delay={17} />
                <Step text="✓ Competência 5 · proposta de intervenção" delay={21} />
                <Step text="Comparando com a matriz oficial do INEP…" delay={25} isLast />
              </div>
            </div>

            <p className="mt-8 text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-[0.2em] animate-pulse">
              O rigor da correção leva tempo. Não feche esta página.
            </p>

            <style>{`
              @keyframes loading-bar {
                0% { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        ) : (
          <div id="corrigir" className="relative w-full space-y-8">
            {typeof window !== 'undefined' && localStorage.getItem("quiz_answers") && (
              <div className="bg-[var(--paper-2)] border border-[var(--line)] rounded-3xl p-6 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 text-[var(--red)] font-black uppercase tracking-widest text-xs mb-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--red)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--red)]"></span>
                  </span>
                  Diagnóstico Personalizado
                </div>
                <div className="space-y-4 text-[var(--ink-2)] font-medium leading-relaxed">
                  {(() => {
                    try {
                      const quiz = JSON.parse(localStorage.getItem("quiz_answers") || "{}");
                      
                      
                      return (
                        <>
                          <p>
                            {quiz.essays_written === "Nenhuma ainda" ? (
                              <>Você ainda não escreveu nenhuma redação para treinar. Começar agora é a forma mais rápida de descobrir e corrigir seus erros.</>
                            ) : (
                              <>Você já escreveu <span className="text-[var(--ink)] font-bold">{quiz.essays_written.toLowerCase()}</span> redações, mas <span className="text-[var(--ink)] font-bold">{quiz.essays_corrected?.toLowerCase() === "nenhuma" ? "nenhuma delas foi corrigida de verdade" : "poucas receberam uma correção de verdade"}</span>. Sem feedback real, você pode estar repetindo os mesmos erros.</>
                            )}
                          </p>
                          {showEssayForm && (
                            <>
                              <p>
                                É hora de parar de chutar e começar a agir com estratégia.
                              </p>
                              <p className="text-[var(--ink)] font-bold italic border-l-4 border-[var(--red)] pl-4 py-2 bg-[var(--red)]/5">
                                "Cole sua redação abaixo para descobrir exatamente onde você está perdendo ponto."
                              </p>
                            </>
                          )}
                        </>
                      );
                    } catch (e) {
                      return <p>Analise sua redação agora com os critérios oficiais do INEP.</p>;
                    }
                  })()}
                </div>
              </div>
            )}
            {!showEssayForm && (
              <div className="rounded-3xl border border-[var(--red)] bg-[var(--paper-2)] p-8 text-center shadow-sm">
                <p className="mx-auto mb-6 max-w-md text-sm font-medium text-[var(--ink-2)]">Sua análise inicial está pronta. Continue para colar sua redação e descobrir sua nota real.</p>
                <button type="button" onClick={onContinue} className="inline-flex items-center justify-center rounded-2xl bg-[var(--red)] px-8 py-4 text-sm font-black text-[var(--paper)] transition-transform hover:scale-105">CONTINUAR PARA A REDAÇÃO <ArrowRight className="ml-2 h-4 w-4" /></button>
              </div>
            )}
            {showEssayForm && (
              <div className="rounded-3xl border border-[var(--red)] bg-[var(--paper-2)] p-8 text-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--red)]">O ENEM está chegando</p>
                <div className="my-4 grid grid-cols-4 gap-2 font-['Fraunces'] text-[var(--ink)]" aria-label="Contagem regressiva para o ENEM">
                  {Object.entries(timeUntilExam).map(([unit, value]) => (
                    <div key={unit} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-2 py-3">
                      <div className="text-2xl font-black tabular-nums md:text-3xl">{String(value).padStart(2, "0")}</div>
                      <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--ink-3)]">{unit === "days" ? "dias" : unit === "hours" ? "horas" : unit === "minutes" ? "min" : "seg"}</div>
                    </div>
                  ))}
                </div>
                <p className="mx-auto max-w-md text-sm font-medium text-[var(--ink-2)]">Cada dia sem feedback é uma oportunidade perdida de melhorar sua nota.</p>
              </div>
            )}
            <form
              onSubmit={onSubmit}
              className={`rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8 transition-all duration-500 overflow-hidden ${!showEssayForm ? "hidden" : ""} ${(result || (isLoggedIn && !isPro)) && showPaywall ? "blur-2xl opacity-20 pointer-events-none scale-95" : ""}`}
              style={{ boxShadow: "var(--paper-shadow)" }}
            >
              <label className="mb-2 block text-sm font-bold text-[var(--red)] uppercase tracking-widest">Tema da redação</label>
              <input
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                required
                maxLength={300}
                placeholder="Ex: Desafios para a valorização da comunidade indígena no Brasil"
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <label className="mt-5 mb-2 block text-sm font-bold text-[var(--red)] uppercase tracking-widest">Cole sua redação aqui</label>
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
                <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive-foreground animate-in slide-in-from-top-2 duration-300">
                  <p className="font-bold mb-1">Ops! Algo deu errado:</p>
                  <p className="opacity-90">{erro}</p>
                  <button 
                    type="button" 
                    onClick={() => setErro(null)}
                    className="mt-2 text-[10px] uppercase tracking-wider font-black hover:underline"
                  >
                    Fechar aviso
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  type="submit"
                  disabled={loading || charCount < 200 || tema.trim().length < 3 || (!isLoggedIn && showPaywall)}
                  className="flex-1 rounded-xl py-4 text-lg font-black text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", boxShadow: "0 0 20px rgba(34, 197, 94, 0.4)" }}
                >
                  CORRIGIR AGORA COM IA →
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setTema("Desafios para a formação educacional de surdos no Brasil");
                    setRedacao(`A Constituição Federal de 1988, norma de maior hierarquia no sistema jurídico brasileiro, garante a todos os cidadãos, sem distinção, o direito à educação de qualidade. Entretanto, a realidade vivenciada por indivíduos surdos no Brasil distancia-se desse ideal democrático. Nesse contexto, é fundamental analisar como a negligência governamental e o preconceito social corroboram a exclusão dessa parcela da população do ambiente acadêmico.

Em primeira análise, a falta de infraestrutura e de profissionais capacitados nas instituições de ensino atua como um entrave à inclusão. Segundo o filósofo John Rawls, em sua teoria da justiça, uma sociedade é justa quando garante as mesmas oportunidades para todos. Contudo, o sistema educacional brasileiro falha ao não disponibilizar intérpretes de Libras em quantidade suficiente e ao não adaptar materiais pedagógicos para a necessidade dos surdos. Dessa forma, o acesso ao conhecimento é restrito, perpetuando um ciclo de desigualdade que impede o pleno desenvolvimento desses cidadãos.

Além disso, o estigma social direcionado às pessoas com deficiência auditiva agrava a problemática. Para o sociólogo Erving Goffman, o estigma é um atributo que torna o indivíduo diferente e menos desejável, resultando em sua marginalização. Muitas vezes, a surdez é vista sob uma ótica de incapacidade, o que gera comportamentos discriminatórios tanto por parte de colegas quanto de professores. Essa barreira simbólica não apenas desestimula o estudante surdo a prosseguir com seus estudos, mas também o isola socialmente, comprometendo sua saúde mental e sua integração na coletividade.

Portanto, medidas são necessárias para reverter esse cenário de exclusão. Cabe ao Ministério da Educação ampliar o investimento na formação de professores bilíngues e na contratação de intérpretes para todas as escolas da rede pública. Paralelamente, é dever do Governo Federal promover campanhas de conscientização nas mídias de grande alcance, com o intuito de desconstruir preconceitos e valorizar a cultura surda. Somente assim, o Brasil poderá assegurar a todos os seus cidadãos o direito constitucional à educação, construindo uma sociedade verdadeiramente inclusiva.`);
                  }}
                  className="px-6 rounded-xl border border-[var(--line)] bg-[var(--paper-2)] text-[var(--ink-2)] font-bold text-sm hover:bg-[var(--line)]/10 transition-colors"
                >
                  Usar um exemplo
                </button>
              </div>
              
              <p className="mt-3 text-center text-xs font-bold text-muted-foreground">
                100% privado
              </p>
            </form>

            {((result && showPaywall) || (isLoggedIn && !canCorrect && showPaywall) || (!isLoggedIn && showPaywall)) && (
              <div id="paywall-anchor" className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[var(--paper)]/80 backdrop-blur-sm flex items-start justify-center p-4 md:p-6 pt-20 md:pt-24 pb-10 font-['Public_Sans']">
                <div 
                  className="w-full max-w-lg md:max-w-4xl rounded-3xl border border-[var(--red)]/30 bg-[var(--paper)] p-6 md:p-10 shadow-[var(--paper-shadow)] backdrop-blur-2xl relative animate-in fade-in zoom-in duration-500"
                >

                  <div className="absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-[var(--red)]/10" />
                      <div className="relative p-5 rounded-full bg-[var(--paper)] text-[var(--red)] border-4 border-[var(--red)] shadow-[0_0_30px_rgba(196,50,42,0.2)]">
                        <Trophy className="w-10 h-10 md:w-12 md:h-12" />
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="font-['Fraunces'] text-3xl md:text-4xl font-black mb-4 mt-4 tracking-tighter uppercase italic text-center text-[var(--ink)]">
                    {semCreditos ? "Seus créditos acabaram" : (result || showPaywall) ? "Análise Pronta! 🎯" : "Quase lá..."}
                  </h2>
                  
                  <p className="text-sm md:text-base text-[var(--ink-2)] font-semibold mb-6 md:mb-8 leading-relaxed text-center">
                    {!isLoggedIn 
                      ? "Vamos continuar com os créditos gratuitos para salvar seu diagnóstico e desbloquear sua correção detalhada com nota oficial padrão INEP."
                      : semCreditos
                        ? "Você já usou as 15 correções do Plano Essencial. Recarregue créditos ou faça o upgrade para o Combo Nota 1000 e corrija sem limite nenhum."
                        : (result || showPaywall)
                          ? "Sua correção detalhada e nota oficial já foram geradas com precisão INEP."
                          : "Você está a um passo de desbloquear seu potencial máximo e conquistar sua vaga no curso dos sonhos."}
                  </p>

                  {!isLoggedIn && (
                    <div className="mb-8 flex flex-col gap-4 items-center">
                       <button
                         onClick={() => window.location.href = "/auth"}
                         className="w-full max-w-sm py-4 rounded-xl bg-[var(--red)] text-white font-black text-lg uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                       >
                         CRIAR MINHA CONTA GRÁTIS
                       </button>
                       <p className="text-xs font-bold text-[var(--ink-3)] uppercase tracking-widest">
                         Leve apenas 10 segundos
                       </p>
                    </div>
                  )}

                  {semCreditos && (
                    <div className="mb-8">
                      <p className="text-[11px] font-black uppercase tracking-widest text-[var(--ink-3)] mb-3 text-center">
                        Recarregue seus créditos
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { qtd: 5, preco: "R$ 7,90" },
                          { qtd: 10, preco: "R$ 9,90" },
                          { qtd: 20, preco: "R$ 14,90" },
                        ].map((pack) => (
                          <button
                            key={pack.qtd}
                            onClick={() => handleBuyCredits(pack.qtd)}
                            className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-4 text-center hover:border-[var(--red)] hover:bg-[var(--paper-2)]/80 transition-all shadow-sm"
                          >
                            <div className="text-lg font-black text-[var(--ink)]">{pack.qtd} correções</div>
                            <div className="text-sm font-black text-[var(--red)]">{pack.preco}</div>
                            <div className="mt-2 rounded-lg bg-[var(--red)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--red)]">
                              Obtenha clicando aqui
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-center text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-widest">
                        Créditos disponíveis apenas para quem tem o Plano Essencial
                      </p>
                    </div>
                  )}

                  {isLoggedIn && (
                  <div className="space-y-6">
                    <div className={`grid grid-cols-1 gap-4 ${semCreditos ? "" : "md:grid-cols-2"}`}>

                      {/* PLANO ESSENCIAL - escondido para quem já comprou */}
                      {!semCreditos && (
                      <div className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]/50 p-5 relative overflow-hidden group transition-all hover:bg-[var(--paper-2)] shadow-sm">
                        
                        <div className="mb-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[var(--line)]/30 flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5 text-[var(--ink-3)]" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-[var(--ink)] leading-tight uppercase tracking-tight">Plano Essencial</h3>
                            <p className="text-[11px] font-bold text-[var(--ink-3)] leading-tight uppercase tracking-widest">ACESSO VITALÍCIO • 15 CORREÇÕES</p>
                          </div>
                        </div>
                        
                        <ul className="space-y-2 mb-6 flex-1">
                          <li className="flex items-start gap-2 text-sm font-medium text-[var(--ink-2)]">
                            <span className="text-green-600 shrink-0 font-bold">✓</span>
                            <span><strong>15 correções</strong> de IA (limite do plano)</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm font-medium text-[var(--ink-2)]">
                            <span className="text-green-600 shrink-0 font-bold">✓</span>
                            <span>Histórico com <strong>gráfico de evolução</strong></span>
                          </li>
                          <li className="flex items-start gap-2 text-sm font-medium text-[var(--ink-2)]">
                            <span className="text-green-600 shrink-0 font-bold">✓</span>
                            <span>Feedback oficial padrão <strong>INEP</strong></span>
                          </li>
                          <li className="flex items-start gap-2 text-sm font-medium text-[var(--ink-2)]">
                            <span className="text-green-600 shrink-0 font-bold">✓</span>
                            <span>Pode comprar <strong>créditos extras</strong> depois</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm font-medium text-[var(--ink-3)]">
                            <span className="text-[var(--red)] shrink-0 font-bold">✕</span>
                            <span className="line-through italic">Correções ilimitadas</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm font-medium text-[var(--ink-3)]">
                            <span className="text-[var(--red)] shrink-0 font-bold">✕</span>
                            <span className="line-through italic">Laboratório de Conectivos IA</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm font-medium text-[var(--ink-3)]">
                            <span className="text-[var(--red)] shrink-0 font-bold">✕</span>
                            <span className="line-through italic">Gerador de Repertório Coringa</span>
                          </li>
                        </ul>

                        <div className="mt-auto pt-4 border-t border-[var(--line)]">
                          <div className="flex items-baseline gap-2 mb-4">
                             <span className="text-sm font-bold text-[var(--ink-3)] line-through italic">R$ 29,90</span>
                             <span className="text-3xl font-black text-[var(--ink)]">R$ 19,90</span>
                          </div>
                          <button
                            onClick={() => handleTestPurchase("basic")}
                            className="w-full py-4 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                          >
                            LIBERAR AGORA
                          </button>
                          <p className="mt-3 text-center text-[9px] font-bold text-[var(--ink-3)] uppercase tracking-[0.2em]">Desconto de R$ 10,00</p>
                        </div>
                      </div>
                      )}


                      {/* COMBO NOTA 1000 */}
                      <div className="flex flex-col rounded-2xl border-2 border-[var(--red)] bg-[var(--red)]/5 p-5 relative overflow-hidden group shadow-[0_20px_40px_-12px_rgba(196,50,42,0.15)] scale-[1.02]">
                        
                        <div className="mb-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[var(--red)] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(196,50,42,0.4)]">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-[var(--ink)] leading-tight uppercase tracking-tight">Combo Nota 1000</h3>
                            <p className="text-[11px] font-bold text-[var(--red)] leading-tight uppercase tracking-widest">O PODER DA APROVAÇÃO</p>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-6 flex-1">
                          {[
                            { t: "Correções ILIMITADAS para sempre", d: "Sem créditos, sem limite. Treine até fechar a nota." },
                            { t: "IA de Repertório Sociocultural", d: "Gera repertório legitimado para qualquer tema." },
                            { t: "Laboratório de Conectivos (IA)", d: "Corrige sua Competência 4 em segundos." },
                            { t: "70+ Repertórios Coringas", d: "Biblioteca validada que encaixa em tudo." },
                            { t: "Suporte priorizado via WhatsApp", d: "Atendimento humano e rápido." },
                          ].map((b) => (
                            <li key={b.t} className="flex items-start gap-2">
                              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[var(--red)] text-white text-[11px] font-black flex items-center justify-center">✓</span>
                              <div className="leading-tight">
                                <div className="text-sm font-black text-[var(--ink)]">{b.t}</div>
                                <div className="text-xs font-medium text-[var(--ink-2)] mt-0.5">{b.d}</div>
                              </div>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto pt-4 border-t border-[var(--line)]">
                          <div className="flex items-baseline gap-2 mb-4">
                             <span className="text-sm font-bold text-[var(--ink-3)] line-through italic">R$ 59,00</span>
                             <span className="text-3xl font-black text-[var(--ink)]">R$ 39,00</span>
                          </div>
                          <button
                            onClick={() => handleTestPurchase("combo")}
                            className="w-full py-5 rounded-xl bg-[var(--red)] text-white font-black text-sm uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_-5px_rgba(196,50,42,0.4)]"
                          >
                            LIBERAR TUDO AGORA
                          </button>
                          <p className="mt-3 text-center text-[9px] font-bold text-[var(--red)] uppercase tracking-[0.2em]">Desconto de R$ 20,00</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-center pt-4">
                      <p className="text-xs text-[var(--ink)] font-black uppercase tracking-widest bg-[var(--paper-2)] py-2 rounded-lg border border-[var(--line)] shadow-sm">
                        ⚡ Liberação Imediata • Pagamento Único
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}

function estimateGuessNumber(chuta: string): number {
  const nums = chuta.match(/\d+/g)?.map(Number) || [];
  if (nums.length === 0) return 800;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

function Resultado({ data, isLoggedIn, showPaywall, onShowAll }: { data: Correcao; isLoggedIn: boolean; showPaywall?: boolean; onShowAll?: () => void }) {
  const quizAnswers = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("quiz_answers") || "{}") : {};
  const chuta = quizAnswers.current_estimate || "800 a 900";
  const notaTotal = data.nota_total;
  const diff = Math.abs(notaTotal - estimateGuessNumber(chuta));

  return (
    <div
      id="resultado"
      className="mt-10 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8 overflow-hidden relative"
      style={{ boxShadow: "var(--paper-shadow)" }}
    >
      <div className="text-center mb-10">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--ink-3)] mb-2">
          Resultado da Análise
        </div>
        <p className="text-sm font-medium text-[var(--ink-2)] mb-4">
          Você chutou {chuta}. Sua nota real é:
        </p>
        <div className="text-7xl md:text-8xl font-black text-[var(--red)] font-['Fraunces'] leading-none">
          {data.nota_total}
          <span className="text-xl text-[var(--ink-3)] ml-2 tracking-tighter">/1000</span>
        </div>
        <p className="mt-6 text-sm font-bold text-[var(--ink)] max-w-md mx-auto leading-relaxed">
          São {diff} pontos de diferença entre o que você achava e o que a banca veria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
        {data.competencias.map((c, idx) => {
          // A prévia sempre libera a nota total e a Competência 1.
          // Apenas C2–C5 ficam borradas até o desbloqueio do resultado completo.
          const isLockedPreview = showPaywall === true && idx > 0;

          return (
          <div 
            key={c.numero} 
            className={`rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5 transition-all duration-500 flex flex-col ${isLockedPreview ? "blur-md select-none opacity-40" : ""}`}
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 font-bold text-[var(--ink)] text-xs md:text-sm">
                <span className="flex h-5 w-5 shrink-0 rounded-full bg-[var(--red)] text-white text-[10px] font-black items-center justify-center">✓</span>
                C{c.numero}
              </div>
              <div className="text-lg font-black text-[var(--red)] font-['Fraunces']">
                {c.nota}
                <span className="text-[10px] text-[var(--ink-3)] ml-1">/200</span>
              </div>
            </div>
            <p className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-widest mb-2 truncate">
              {c.titulo}
            </p>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed font-medium line-clamp-3">
              {isLockedPreview ? "Conteúdo bloqueado. Adquira um plano para ver a análise completa desta competência." : c.analise}
            </p>
          </div>
          );
        })}

        {showPaywall && (
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--paper)] to-transparent pointer-events-none" />
        )}
      </div>

      {showPaywall && (
        <div className="mt-8 flex justify-center relative z-10">
          <button
            onClick={onShowAll}
            className="group relative inline-flex items-center justify-center rounded-2xl bg-[var(--red)] px-8 py-5 text-sm font-black text-white transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-12px_rgba(196,50,42,0.3)]"
          >
            VER TODAS AS COMPETÊNCIAS
            <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {!showPaywall && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> Pontos Fortes
            </div>
            <ul className="space-y-2">
              {data.pontos_fortes.map((item, i) => (
                <li key={i} className="text-xs font-medium text-[var(--ink-2)] leading-tight flex gap-2">
                  <span className="text-[var(--red)]">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--red)] mb-3 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Sugestões de Melhoria
            </div>
            <ul className="space-y-2">
              {data.sugestoes.map((item, i) => (
                <li key={i} className="text-xs font-medium text-[var(--ink-2)] leading-tight flex gap-2">
                  <span className="text-[var(--red)]">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
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
