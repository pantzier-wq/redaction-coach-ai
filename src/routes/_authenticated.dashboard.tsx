import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analisarConectivos, criarRepertorio } from "@/lib/correct-essay.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type Correcao, type RespostaRepertorio } from "@/lib/correct-essay.functions";
import { EssaySubmissionArea } from "@/components/EssaySubmissionArea";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { goToCheckout, goToCreditsCheckout } from "@/lib/checkout";
import { CouponUnlockedBanner } from "@/components/CouponUnlockedBanner";

import { 
  History, 
  Star, 
  BookOpen, 
  Zap, 
  CreditCard, 
  Trophy, 
  Sparkles,
  ArrowRight,
  PenTool,
  Search,
  Copy,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  HelpCircle,
  Play,
  MessageSquare,
  TrendingUp
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";


export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [essays, setEssays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profRes, essayRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        // Usando uma query RPC ou garantindo unicidade no app?
        // Vamos apenas garantir que pegamos os dados e o frontend lida com exibição.
        // Se houver duplicatas por inserções rápidas, podemos filtrar aqui.
        supabase.from("essays").select("*").order("created_at", { ascending: false })
      ]);

      // Filtragem por unicidade baseada em ID e timestamp para evitar duplicatas visuais
      const uniqueEssays = (essayRes.data || []).reduce((acc: any[], current: any) => {
        const isDuplicate = acc.some(item => item.id === current.id);
        if (!isDuplicate) {
          return [...acc, current];
        }
        return acc;
      }, []);

      setProfile(profRes.data);
      setEssays(uniqueEssays);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const handleTestPurchase = async (type: 'pro' | 'full' = 'pro') => {
    // Redireciona para o checkout real (Cakto). A liberação acontece após o pagamento.
    await goToCheckout(type === 'full' ? 'combo' : 'essencial');
  };


  const handleBuyCredits = async (qtd: number) => {
    // Redireciona para o checkout real da recarga (Cakto).
    await goToCreditsCheckout(qtd);
  };





  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--red)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex">
      <Sidebar 
        profile={profile} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        onLogout={handleLogout}
      />

      <main className="flex-1 md:ml-64 min-h-screen pt-20 md:pt-0 w-full overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 w-full overflow-hidden">
          {activeSection === "dashboard" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--paper-2)] border border-[var(--line)] text-[var(--red)] text-xs font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
                  <Trophy className="w-3 h-3" /> Dashboard Estudante
                </div>
                <h1 className="font-['Fraunces'] text-5xl md:text-6xl font-black mb-6 tracking-tight text-[var(--ink)] leading-tight">
                  Olá, <span className="text-[var(--red)] italic">{profile?.full_name?.split(' ')[0] || 'Estudante'}</span>! ✍️
                </h1>
                <p className="text-lg md:text-xl text-[var(--ink-2)] max-w-xl mx-auto mb-10 font-medium">
                  Pronto para a nota 1000 hoje? Cole seu texto abaixo para começar a correção.
                </p>

                <div className="max-w-3xl mx-auto">
                  <EssaySubmissionArea 
                    isLoggedIn={true} 
                    isPro={!!profile?.is_pro}
                    onSuccess={() => {
                      const loadData = async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        
                        const [profRes, essayRes] = await Promise.all([
                          supabase.from("profiles").select("*").eq("id", user.id).single(),
                          supabase.from("essays").select("*").order("created_at", { ascending: false })
                        ]);
                        
                        if (profRes.data) setProfile(profRes.data);
                        
                        const currentEssays = essayRes.data || [];
                        
                        // Sistema de limite de 50 redações (exclusivo para quem tem plano)
                        if (currentEssays.length > 50) {
                          const toDelete = currentEssays.slice(50);
                          const deleteIds = toDelete.map(e => e.id);
                          await supabase.from("essays").delete().in("id", deleteIds);
                          
                          const uniqueEssays = currentEssays.slice(0, 50).reduce((acc: any[], current: any) => {
                            if (!acc.some(item => item.id === current.id)) return [...acc, current];
                            return acc;
                          }, []);
                          setEssays(uniqueEssays);
                        } else {
                          const uniqueEssays = currentEssays.reduce((acc: any[], current: any) => {
                            if (!acc.some(item => item.id === current.id)) return [...acc, current];
                            return acc;
                          }, []);
                          setEssays(uniqueEssays);
                        }
                      };
                      loadData();
                    }}
                  />
                </div>
              </div>


            </div>
          )}

          {activeSection === "correcao" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black flex items-center gap-3">
                  <PenTool className="w-8 h-8 text-primary" />
                  Nova Correção
                </h2>
                <p className="text-muted-foreground mt-2">Nossa IA está pronta para analisar seu texto com rigor oficial.</p>
              </div>
              <EssaySubmissionArea 
                isLoggedIn={true} 
                isPro={!!profile?.is_pro}
                onSuccess={() => {
                  const loadData = async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    
                    const [profRes, essayRes] = await Promise.all([
                      supabase.from("profiles").select("*").eq("id", user.id).single(),
                      supabase.from("essays").select("*").order("created_at", { ascending: false })
                    ]);
                    
                    if (profRes.data) setProfile(profRes.data);
                    
                    const currentEssays = essayRes.data || [];
                    
                    if (currentEssays.length > 50) {
                      const toDelete = currentEssays.slice(50);
                      const deleteIds = toDelete.map(e => e.id);
                      await supabase.from("essays").delete().in("id", deleteIds);
                      
                      const uniqueEssays = currentEssays.slice(0, 50).reduce((acc: any[], current: any) => {
                        if (!acc.some(item => item.id === current.id)) return [...acc, current];
                        return acc;
                      }, []);
                      setEssays(uniqueEssays);
                    } else {
                      const uniqueEssays = currentEssays.reduce((acc: any[], current: any) => {
                        if (!acc.some(item => item.id === current.id)) return [...acc, current];
                        return acc;
                      }, []);
                      setEssays(uniqueEssays);
                    }
                  };
                  loadData();
                }}
              />
            </div>
          )}

          {activeSection === "historico" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black flex items-center gap-3">
                  <History className="w-8 h-8 text-primary" />
                  Minhas Redações
                </h2>
                <p className="text-muted-foreground mt-2">Acompanhe sua evolução através das correções anteriores.</p>
              </div>
              <div className="grid gap-4 w-full">
                {essays.length > 0 ? (
                  essays.map((essay) => (
                    <div 
                      key={essay.id} 
                      onClick={() => {
                        if (!profile?.is_pro) {
                          setActiveSection("upgrade");
                        } else {
                          setActiveSection("correcao");
                          localStorage.setItem("viewing_essay", JSON.stringify(essay));
                        }
                      }}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]/50 p-4 md:p-6 hover:border-[var(--red)]/50 transition-all hover:scale-[1.01] cursor-pointer group w-full box-border overflow-hidden shadow-sm"
                    >
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center text-[var(--red)] font-black shadow-inner">
                            {new Date(essay.created_at).getDate()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold truncate group-hover:text-[var(--red)] transition-colors pr-2 text-[var(--ink)]">{essay.tema}</h3>
                            <p className="text-[10px] md:text-xs text-[var(--ink-3)] font-medium">
                              {new Date(essay.created_at).toLocaleDateString('pt-BR')} • {essay.redacao.length} caracteres
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-black text-[var(--red)] shrink-0">
                          {(essay.resultado as Correcao).nota_total}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold">Você ainda não enviou nenhuma redação.</p>
                    <button 
                      onClick={() => setActiveSection("correcao")}
                      className="mt-4 text-primary font-black hover:underline"
                    >
                      Enviar redação agora →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "progresso" && (
            profile?.is_pro ? (
              <ProgressSection essays={essays} onGoToCorrection={() => setActiveSection("correcao")} />
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-2xl mx-auto text-center py-20">
                  <div className="p-6 rounded-3xl bg-emerald-400/10 border-2 border-emerald-400/20 mb-8 inline-block">
                    <TrendingUp className="w-16 h-16 text-emerald-400 animate-pulse" />
                  </div>
                  <h2 className="text-4xl font-black mb-4 tracking-tight">Análise de Evolução Bloqueada 📈</h2>
                  <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                    Acompanhe seu gráfico de notas e desempenho por competência em tempo real com o Plano PRO.
                  </p>
                  <button 
                    onClick={() => setActiveSection("upgrade")}
                    className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    LIBERAR MEU PROGRESSO AGORA
                  </button>
                </div>
              </div>
            )
          )}



          {activeSection === "upgrade" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="p-6 rounded-3xl bg-[var(--paper-2)] border-2 border-[var(--line)] mb-8 inline-block shadow-sm">
                  <Sparkles className="w-16 h-16 text-[var(--red)] animate-pulse" />
                </div>
                <h2 className="font-['Fraunces'] text-4xl font-black mb-4 tracking-tight text-[var(--ink)] italic">Garanta seu Futuro 🚀</h2>
                <p className="text-xl text-[var(--ink-2)] mb-8 leading-relaxed font-medium">
                  Escolha entre o Plano Essencial (15 correções) ou o Combo Nota 1000 com correções ilimitadas.
                </p>

                {/* CRÉDITOS EXTRAS — exclusivo para quem tem o Plano Essencial */}
                {profile?.is_pro && !(profile as any)?.has_full_access && (
                  <div className="mb-12 rounded-3xl border border-[var(--line)] bg-[var(--paper-2)]/50 p-6 text-left shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-[var(--ink)]">Créditos de Correção</h3>
                        <p className="text-sm text-[var(--ink-2)] font-medium">
                          Saldo atual: <strong className="text-[var(--red)]">{(profile as any)?.credits ?? 0}</strong> correções
                        </p>
                      </div>
                      <Zap className="w-8 h-8 text-[var(--red)] shrink-0" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { qtd: 5, preco: "R$ 7,90" },
                        { qtd: 10, preco: "R$ 9,90" },
                        { qtd: 20, preco: "R$ 14,90" },
                      ].map((pack) => (
                        <button
                          key={pack.qtd}
                          onClick={() => handleBuyCredits(pack.qtd)}
                          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-center hover:border-[var(--red)]/60 transition-all shadow-sm"
                        >
                          <div className="text-lg font-black text-[var(--ink)]">{pack.qtd} correções</div>
                          <div className="text-sm font-black text-green-600">{pack.preco}</div>
                          <div className="mt-2 rounded-lg bg-green-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-green-600 border border-green-100">
                            Obtenha clicando aqui
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-12">
                   {/* PLANO ESSENCIAL */}
                   <div className="flex flex-col rounded-3xl border border-[var(--line)] bg-[var(--paper-2)]/50 p-8 relative overflow-hidden group shadow-sm transition-all hover:bg-[var(--paper-2)]">
                    
                    <div className="mb-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[var(--line)]/30 flex items-center justify-center shrink-0">
                        <Zap className="w-6 h-6 text-[var(--ink-3)]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[var(--ink)] leading-tight uppercase tracking-tight">Plano Essencial</h3>
                        <p className="text-xs font-bold text-[var(--ink-3)] leading-tight uppercase tracking-[0.1em]">Vitalício • 15 correções</p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-3 text-sm font-medium text-[var(--ink-2)]">
                        <span className="text-green-600 shrink-0 font-bold">✓</span>
                        <span>15 correções de redação com IA</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-medium text-[var(--ink-2)]">
                        <span className="text-green-600 shrink-0 font-bold">✓</span>
                        <span>Histórico completo de evolução</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-medium text-[var(--ink-2)]">
                        <span className="text-green-600 shrink-0 font-bold">✓</span>
                        <span>Pode comprar créditos extras depois</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-medium text-[var(--ink-3)]">
                        <span className="text-[var(--red)] shrink-0 font-bold">✕</span>
                        <span className="line-through italic">Correções ilimitadas</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-medium text-[var(--ink-3)]">
                        <span className="text-[var(--red)] shrink-0 font-bold">✕</span>
                        <span className="line-through italic">70+ Repertórios Universais</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-medium text-[var(--ink-3)]">
                        <span className="text-[var(--red)] shrink-0 font-bold">✕</span>
                        <span className="line-through italic">Laboratório de Conectivos</span>
                      </li>
                    </ul>

                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-lg font-bold text-[var(--ink-3)] line-through italic">R$ 29,90</span>
                        <span className="text-3xl font-black text-[var(--ink)]">R$ 19,90</span>
                      </div>
                      <button
                        onClick={() => handleTestPurchase('pro')}
                        disabled={!!profile?.is_pro}
                        className="w-full py-4 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {profile?.is_pro ? "PLANO ATIVO" : "LIBERAR ESSENCIAL"}
                      </button>
                    </div>
                  </div>


                  {/* COMBO NOTA 1000 - Premium */}
                   <div className="flex flex-col rounded-3xl border-2 border-[var(--red)] bg-[var(--red)]/5 p-8 relative overflow-hidden group shadow-[0_20px_40px_-12px_rgba(196,50,42,0.15)] scale-[1.05]">
                    
                    <div className="mb-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[var(--red)] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(196,50,42,0.4)]">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[var(--ink)] leading-tight uppercase tracking-tight">Combo Nota 1000</h3>
                        <p className="text-xs font-bold text-[var(--red)] leading-tight uppercase tracking-[0.1em]">Acesso Total + Bônus</p>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {[
                        { t: "Correções ILIMITADAS Vitalícias", d: "Treine sem limites até o dia da prova." },
                        { t: "Laboratório de Conectivos IA", d: "Analise sua coesão textual instantaneamente." },
                        { t: "Gerador de Repertório Coringa", d: "Repertórios que encaixam em qualquer tema." },
                        { t: "70+ Repertórios Legitimados", d: "Biblioteca exclusiva validada por corretores." },
                        { t: "Histórico Completo", d: "Gráfico de evolução e acompanhamento nota a nota." },
                      ].map((b) => (
                        <li key={b.t} className="flex items-start gap-3">
                          <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-[var(--red)] text-white text-xs font-black flex items-center justify-center shadow-sm">✓</span>
                          <div className="leading-tight">
                            <div className="text-sm font-black text-[var(--ink)]">{b.t}</div>
                            <div className="text-[11px] font-medium text-[var(--ink-2)] mt-0.5">{b.d}</div>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-lg font-bold text-[var(--ink-3)] line-through italic">R$ 59,00</span>
                        <span className="text-3xl font-black text-[var(--ink)]">R$ 39,00</span>
                      </div>
                      <button
                        onClick={() => handleTestPurchase('full')}
                        className="w-full py-5 rounded-xl bg-[var(--red)] text-white font-black text-sm uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_-5px_rgba(196,50,42,0.4)]"
                      >
                        LIBERAR TUDO AGORA
                      </button>
                      <p className="mt-4 text-center text-[10px] font-black text-[var(--red)] uppercase tracking-[0.2em]">Desconto de R$ 20,00</p>
                    </div>

                    {/* Badge de destaque */}
                    <div className="absolute top-4 right-[-40px] rotate-45 bg-[var(--red)] text-white text-[10px] font-black py-1.5 px-12 uppercase tracking-[0.2em] shadow-md">
                      RECOMENDADO
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "repertorios" && (

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* 2. Abertura da página */}
              <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                  <BookOpen className="w-3 h-3" /> Mais de 70 repertórios disponíveis
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                  Nunca mais fique sem saber o que citar na redação
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Encontre repertórios de filosofia, sociologia, história, literatura, cinema, legislação e cultura brasileira para fortalecer seus argumentos.
                </p>
                <div className="mt-8 p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row gap-6 items-center">
                  <div className="p-4 rounded-xl bg-primary/5 text-primary shrink-0">
                    <Lightbulb className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[var(--ink)] font-medium italic leading-relaxed">
                      “Um bom repertório não serve apenas para deixar a redação mais bonita. Ele deve ajudar a explicar o problema, comprovar seu argumento ou aprofundar sua análise.”
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Aviso pedagógico inicial */}
              <div className="mb-12 p-8 rounded-[2rem] border-2 border-[var(--red)]/20 bg-[var(--red)]/5 shadow-sm">
                <h2 className="font-['Fraunces'] text-2xl font-black mb-6 flex items-center gap-2 text-[var(--ink)]">
                  <AlertTriangle className="w-6 h-6 text-amber-600" /> Antes de usar um repertório
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-black text-[var(--ink)] uppercase text-xs tracking-widest">Ele é verdadeiro?</h3>
                    <p className="text-sm text-[var(--ink-2)] font-medium">Não invente autores, frases, leis, filmes, pesquisas ou acontecimentos históricos.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-[var(--ink)] uppercase text-xs tracking-widest">Ele combina com o tema?</h3>
                    <p className="text-sm text-[var(--ink-2)] font-medium">A referência precisa estar claramente relacionada ao problema discutido.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-[var(--ink)] uppercase text-xs tracking-widest">Ele fortalece seu argumento?</h3>
                    <p className="text-sm text-[var(--ink-2)] font-medium">Não basta citar. Depois de apresentar o repertório, explique o que ele demonstra e como se conecta à sua tese.</p>
                  </div>
                </div>
                <div className="mt-8 p-6 rounded-2xl bg-[var(--paper)] border border-[var(--line)] text-sm italic text-[var(--ink-3)] font-medium shadow-inner">
                  Repertório coringa não significa repertório automático. A referência precisa ser adaptada ao tema e explicada dentro da argumentação.
                </div>
              </div>

              {/* Biblioteca de Repertórios Section */}
              {(profile as any)?.has_full_access ? (
                <RepertoriosLibrary />
              ) : (
                <LockedLibraryOffer
                  titulo="Biblioteca completa de 70+ Repertórios Coringas"
                  descricao="Você viu a introdução. A biblioteca completa, com repertórios prontos por eixo temático e a IA que cria repertórios sob medida para o seu tema, faz parte do Combo Nota 1000."
                  itens={[
                    "70+ repertórios validados (filosofia, sociologia, história, cinema, leis)",
                    "IA de Repertório: gera citação + como aplicar no seu tema",
                    "Busca por eixo temático e cópia rápida para o seu texto",
                    "Correções de redação ilimitadas e vitalícias",
                    "Laboratório de Conectivos IA + quiz e flashcards",
                    "Histórico de evolução com até 50 redações",
                  ]}
                  onBuy={() => handleTestPurchase('full')}
                  onSeePlans={() => setActiveSection("upgrade")}
                />
              )}
            </div>
          )}

          {activeSection === "conectivos" && (

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                  <Zap className="w-3 h-3" /> Material Exclusivo
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                  Pare de repetir os mesmos conectivos na redação
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Encontre conectivos para introduzir argumentos, acrescentar ideias, explicar causas, apresentar consequências, fazer oposições e concluir sua redação.
                </p>
                <div className="mt-8 p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row gap-6 items-center">
                  <div className="p-4 rounded-xl bg-primary/5 text-primary shrink-0">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium italic">
                      “Conectivos são palavras e expressões que ajudam a ligar as partes do texto. Porém, não basta colocá-los aleatoriamente: cada conectivo deve representar corretamente a relação entre as ideias.”
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-amber-500 text-sm font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Importante: utilizar muitos conectivos não garante uma nota alta. O mais importante é escolher o conectivo adequado para cada situação.</span>
                    </div>
                  </div>
                </div>
              </div>

              {(profile as any)?.has_full_access ? (
                <>
                  {/* IA de Conectivos */}
                  <div className="mb-12 p-8 rounded-[2rem] border-2 border-primary/20 bg-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <MessageSquare className="w-24 h-24 text-primary" />
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-primary" /> Laboratório de Conectivos IA
                      </h3>
                      <p className="text-muted-foreground text-sm font-bold mb-6 max-w-2xl">
                        Cole sua frase abaixo para que nossa IA analise se o conectivo está bem aplicado ou sugira um melhor para o seu contexto.
                      </p>

                      <ConectivosIA />
                    </div>
                  </div>

                  {/* Biblioteca de Conectivos Section */}
                  <ConectivosLibrary />
                </>
              ) : (
                <LockedLibraryOffer
                  titulo="Biblioteca completa de Conectivos + Laboratório IA"
                  descricao="Essa é só a introdução. A tabela completa de conectivos por função, o quiz de treino e o Laboratório de Conectivos IA fazem parte do Combo Nota 1000."
                  itens={[
                    "Tabela completa de conectivos separados por função",
                    "Laboratório de Conectivos IA: analisa sua frase e sugere o melhor",
                    "Quiz e flashcards para dominar a Competência 4",
                    "70+ Repertórios Coringas + IA de Repertório",
                    "Correções de redação ilimitadas e vitalícias",
                    "Histórico de evolução com até 50 redações",
                  ]}
                  onBuy={() => handleTestPurchase('full')}
                  onSeePlans={() => setActiveSection("upgrade")}
                />
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function ConectivosIA() {
  const [frase, setFrase] = useState("");
  const [analise, setAnalise] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const analyzeFn = useServerFn(analisarConectivos);
  const progressInterval = useRef<any>(null);

  const handleAnalyze = async () => {
    if (!frase.trim() || frase.length < 10) return;
    setIsAnalyzing(true);
    setAnalise(null);
    setProgress(0);
    
    // Inicia a barra de progresso (aproximadamente 10 segundos)
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 1;
      });
    }, 100);

    try {
      const result = await analyzeFn({ data: { frase } });
      
      // Garante que a barra chegue no final antes de mostrar
      setProgress(100);
      setTimeout(() => {
        setAnalise(result);
        setIsAnalyzing(false);
        if (progressInterval.current) clearInterval(progressInterval.current);
      }, 500);
    } catch (error: any) {
      console.error("Erro capturado no frontend:", error);
      alert(`Erro na análise: ${error.message || "Tente novamente"}`);
      setIsAnalyzing(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  };

  const handleReset = () => {
    setFrase("");
    setAnalise(null);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      {!analise && !isAnalyzing && (
        <div className="relative">
          <textarea
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
            placeholder="Ex: No entanto, é necessário que o governo invista em educação..."
            className="w-full min-h-[120px] p-5 rounded-2xl bg-[var(--paper)] border-2 border-[var(--line)] focus:border-[var(--red)] outline-none transition-all font-bold text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)]/40 shadow-inner"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleAnalyze();
            }}
            disabled={isAnalyzing || frase.length < 10}
            className={cn(
              "absolute bottom-4 right-4 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all z-20 shadow-md",
              isAnalyzing || frase.length < 10 
                ? "bg-[var(--line)] text-[var(--ink-3)] cursor-not-allowed" 
                : "bg-[var(--ink)] text-[var(--paper)] hover:scale-105 active:scale-95"
            )}
          >
            Analisar Frase
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500 bg-[var(--red)]/5 rounded-3xl border-2 border-dashed border-[var(--red)]/20 shadow-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[var(--red)]/10 border-t-[var(--red)] animate-spin" />
            <Sparkles className="w-6 h-6 text-[var(--red)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="w-full max-w-md px-8 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--red)]">
              <span>IA Analisando conectivos</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full bg-[var(--red)]/10 rounded-full overflow-hidden border border-[var(--red)]/20 shadow-inner">
              <div 
                className="h-full bg-[var(--red)] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(196,50,42,0.3)]" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-[var(--ink-2)] font-bold animate-pulse mt-4 italic">
              Avaliando a coesão e buscando melhorias...
            </p>
          </div>
        </div>
      )}

      {analise && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 p-8 rounded-3xl border border-[var(--line)] bg-[var(--paper)] relative overflow-hidden shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                analise.status === 'bom' && "bg-green-50 text-green-700 border-green-200",
                analise.status === 'regular' && "bg-amber-50 text-amber-700 border-amber-200",
                analise.status === 'ruim' && "bg-[var(--red)]/5 text-[var(--red)] border-[var(--red)]/20",
              )}>
                Avaliação: {analise.status === 'bom' ? 'Excelente' : analise.status === 'regular' ? 'Pode Melhorar' : 'Necessita Ajuste'}
              </div>
              <button 
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl text-[10px] font-black text-[var(--paper)] bg-[var(--ink)] hover:scale-105 transition-all uppercase tracking-[0.2em] flex items-center gap-2 shadow-md"
              >
                <PenTool className="w-3 h-3" />
                Nova Frase
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ink-3)] mb-1">Análise Técnica</h4>
                <p className="text-base font-bold text-[var(--ink)] leading-relaxed">
                  {analise.analise}
                </p>
              </div>

              {analise.sugestao && (
                <div className="p-6 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] relative shadow-inner">
                  <div className="absolute top-4 right-4">
                    <Sparkles className="w-4 h-4 text-[var(--red)] opacity-50" />
                  </div>
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--red)] mb-2">Sugestão de Upgrade</h4>
                  <p className="text-sm text-[var(--ink)] font-bold italic leading-relaxed">
                    {analise.sugestao}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConectivosLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");

  const categories = [
    { id: "todos", label: "Todos" },
    { id: "introducao", label: "Introdução" },
    { id: "adicao", label: "Adição" },
    { id: "oposicao", label: "Oposição" },
    { id: "conclusao", label: "Conclusão" },
    { id: "causa", label: "Causa/Efeito" }
  ];

  const conectivos = [
    { 
      cat: "introducao", 
      termo: "Em primeira análise", 
      ex: "Em primeira análise, é fundamental destacar que a negligência governamental...", 
      uso: "Iniciar o primeiro parágrafo de desenvolvimento.",
      dica: "Evita começar com 'Atualmente'."
    },
    { 
      cat: "introducao", 
      termo: "Mormente", 
      ex: "Mormente, cabe pontuar o descaso com a infraestrutura escolar.", 
      uso: "Dar ênfase a um ponto inicial.",
      dica: "Palavra de alto valor léxico."
    },
    { 
      cat: "adicao", 
      termo: "Ademais", 
      ex: "Ademais, a ausência de leis rígidas agrava o cenário.", 
      uso: "Acrescentar um novo argumento no mesmo parágrafo ou iniciar o segundo desenvolvimento.",
      dica: "Substitui o simples 'Além disso'."
    },
    { 
      cat: "adicao", 
      termo: "Outrossim", 
      ex: "Outrossim, a influência das redes sociais é inegável.", 
      uso: "Somar uma ideia análoga à anterior.",
      dica: "Excelente para coesão entre parágrafos."
    },
    { 
      cat: " oposicao", 
      termo: "Contudo", 
      ex: "A lei existe; contudo, sua aplicação é ineficaz.", 
      uso: "Expressar contraste ou adversidade.",
      dica: "Cuidado: sempre use vírgula antes ou depois, dependendo da posição."
    },
    { 
      cat: " oposicao", 
      termo: "Entretanto", 
      ex: "Entretanto, a solução não depende apenas do Estado.", 
      uso: "Opor-se a uma ideia citada anteriormente.",
      dica: "Variante forte para 'mas' ou 'porém'."
    },
    { 
      cat: "conclusao", 
      termo: "Portanto", 
      ex: "Portanto, medidas são necessárias para reverter o quadro.", 
      uso: "Iniciar a proposta de intervenção.",
      dica: "O clássico infalível para a C5."
    },
    { 
      cat: "conclusao", 
      termo: "Em suma", 
      ex: "Em suma, a educação é o único caminho para a mudança.", 
      uso: "Sintetizar o que foi discutido.",
      dica: "Ótimo para fechar a frase final da redação."
    },
    { 
      cat: "causa", 
      termo: "Haja vista", 
      ex: "A evasão escolar aumenta, haja vista a falta de incentivos.", 
      uso: "Indicar a razão de um problema.",
      dica: "Não use 'haja visto', o correto é 'vista'."
    },
    { 
      cat: "causa", 
      termo: "Em virtude de", 
      ex: "Em virtude da desigualdade, muitos jovens abandonam os estudos.", 
      uso: "Explicar a origem de um fenômeno.",
      dica: "Conectivo de causa muito elegante."
    },
    {
      cat: "introducao",
      termo: "Sob essa ótica",
      ex: "Sob essa ótica, é perceptível que a passividade social corrobora o problema.",
      uso: "Conectar a tese aos argumentos.",
      dica: "Ajuda a manter a fluidez entre a introdução e o D1."
    },
    {
      cat: "causa",
      termo: "Por conseguinte",
      ex: "A desinformação impera; por conseguinte, o preconceito se alastra.",
      uso: "Mostrar a consequência direta de um fato.",
      dica: "Excelente para fechar parágrafos de desenvolvimento."
    }
  ];

  const filtered = conectivos.filter(c => {
    const matchesSearch = c.termo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.ex.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === "todos" || c.cat === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Search and Filters */}
      <div className="sticky top-2 z-30 flex flex-col gap-4 p-4 rounded-3xl bg-[var(--paper)]/90 backdrop-blur-md border border-[var(--line)] shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--ink-3)]" />
          <input 
            type="text" 
            placeholder="Pesquisar conectivo ou exemplo..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] outline-none transition-all font-bold text-[var(--ink)] placeholder:text-[var(--ink-3)]/40 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all",
                activeCategory === cat.id 
                  ? "bg-[var(--ink)] text-[var(--paper)] shadow-md" 
                  : "bg-[var(--paper-2)] text-[var(--ink-3)] hover:text-[var(--ink)] border border-[var(--line)]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c, i) => (
          <div 
            key={i} 
            className="group p-6 rounded-3xl border border-[var(--line)] bg-[var(--paper)] hover:border-[var(--red)]/40 transition-all hover:scale-[1.02] flex flex-col shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-['Fraunces'] text-xl font-black text-[var(--red)] tracking-tight italic">{c.termo}</h4>
              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-[var(--paper-2)] text-[var(--ink-2)] border border-[var(--line)] tracking-widest">
                {c.cat}
              </span>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="p-4 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)]/50 shadow-inner">
                <p className="text-sm font-medium italic text-[var(--ink)] leading-relaxed">
                  "{c.ex}"
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-2">
                  <div className="mt-1 shrink-0"><Check className="w-3 h-3 text-green-600" /></div>
                  <p className="text-[11px] text-[var(--ink-2)] font-bold italic"><span className="text-[var(--ink)] not-italic font-black uppercase text-[9px] tracking-widest mr-1">Uso:</span> {c.uso}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 shrink-0"><Lightbulb className="w-3 h-3 text-amber-600" /></div>
                  <p className="text-[11px] text-[var(--ink-2)] font-bold italic"><span className="text-[var(--ink)] not-italic font-black uppercase text-[9px] tracking-widest mr-1">Dica:</span> {c.dica}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(c.termo);
                toast.success("Copiado!");
              }}
              className="mt-6 w-full py-3 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Copy className="w-3 h-3" /> Copiar Termo
            </button>
          </div>
        ))}
      </div>

      {/* Bonus Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="p-8 rounded-[2rem] border-2 border-[var(--red)]/20 bg-[var(--paper)] shadow-sm">
          <h3 className="font-['Fraunces'] text-xl font-black text-[var(--red)] mb-6 flex items-center gap-2 italic">
            <X className="w-6 h-6" /> Erros Comuns
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[var(--red)]/10 flex items-center justify-center shrink-0 mt-0.5 text-[var(--red)] font-black text-xs border border-[var(--red)]/20">1</div>
              <p className="text-sm font-bold text-[var(--ink-2)]">
                <strong className="text-[var(--ink)]">Usar "mesmo" como pronome:</strong> "O aluno entregou a redação e o mesmo saiu." (Errado). Prefira: "ele".
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[var(--red)]/10 flex items-center justify-center shrink-0 mt-0.5 text-[var(--red)] font-black text-xs border border-[var(--red)]/20">2</div>
              <p className="text-sm font-bold text-[var(--ink-2)]">
                <strong className="text-[var(--ink)]">Onde vs Aonde:</strong> "Onde" indica lugar fixo. "Aonde" indica movimento. Não use "onde" para substituir "no qual" em ideias abstratas.
              </p>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <ConectivosTraining />
        </div>
      </div>
    </div>
  );
}

function ConectivosTraining() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      text: "O governo deve investir em educação, __________ a sociedade possa evoluir.",
      options: ["Mas", "Portanto", "A fim de que", "Entretanto"],
      correct: 2,
      explanation: "'A fim de que' indica finalidade, conectando o investimento ao objetivo de evolução social."
    },
    {
      text: "A tecnologia traz inúmeros benefícios. __________, o uso excessivo pode causar isolamento social.",
      options: ["Ademais", "Todavia", "Por conseguinte", "Conforme"],
      correct: 1,
      explanation: "'Todavia' introduz uma oposição entre os benefícios e os problemas do uso excessivo."
    },
    {
      text: "A educação é o pilar da sociedade. __________, é necessário que o Estado priorize investimentos nessa área.",
      options: ["Portanto", "Contudo", "Embora", "Caso"],
      correct: 0,
      explanation: "'Portanto' conclui o raciocínio iniciado na frase anterior."
    },
    {
      text: "Muitos jovens sofrem com ansiedade, __________ a pressão por produtividade nas redes sociais.",
      options: ["haja vista", "entretanto", "embora", "mas"],
      correct: 0,
      explanation: "'Haja vista' introduz a causa ou o motivo da ansiedade citada."
    },
    {
      text: "A Constituição Federal garante o direito à saúde. __________, muitos brasileiros enfrentam filas em hospitais.",
      options: ["Nesse sentido", "No entanto", "De fato", "Logo"],
      correct: 1,
      explanation: "'No entanto' marca o contraste entre o direito garantido por lei e a realidade prática."
    },
    {
      text: "É preciso conscientizar a população. __________, a criação de campanhas midiáticas é urgente.",
      options: ["Dessarte", "Embora", "Apesar de", "Ainda que"],
      correct: 0,
      explanation: "'Dessarte' (ou Desse modo) é um conectivo conclusivo formal, ideal para a redação ENEM."
    },
    {
      text: "O acesso à cultura é restrito. __________, o preço elevado dos ingressos afasta as classes baixas.",
      options: ["Ou seja", "Contudo", "Pois", "Se bem que"],
      correct: 2,
      explanation: "'Pois' justifica o motivo de o acesso ser restrito."
    },
    {
      text: "__________ as leis sejam claras, o cumprimento delas ainda é um desafio.",
      options: ["Embora", "Portanto", "Ademais", "Assim"],
      correct: 0,
      explanation: "'Embora' introduz uma concessão, indicando que algo acontece apesar das leis claras."
    },
    {
      text: "O desmatamento cresce na Amazônia. __________, o equilíbrio climático global é ameaçado.",
      options: ["Em contrapartida", "Por conseguinte", "Apesar disso", "Senão"],
      correct: 1,
      explanation: "'Por conseguinte' indica a consequência direta do crescimento do desmatamento."
    },
    {
      text: "O lazer é fundamental para a saúde mental. __________, ele combate o estresse acumulado.",
      options: ["Todavia", "Afinal", "Mesmo que", "Entretanto"],
      correct: 1,
      explanation: "'Afinal' reforça a ideia anterior, servindo como uma explicação ou justificativa."
    },
    {
      text: "O país enfrenta uma crise hídrica. __________, o desperdício de água deve ser combatido.",
      options: ["Nesse contexto", "Contudo", "Porém", "Embora"],
      correct: 0,
      explanation: "'Nesse contexto' situa a necessidade de combate ao desperdício dentro da crise citada."
    },
    {
      text: "A internet democratizou o conhecimento. __________, ela também facilitou a propagação de fake news.",
      options: ["Além disso", "Por outro lado", "Consequentemente", "Ainda que"],
      correct: 1,
      explanation: "'Por outro lado' introduz uma visão contrastante ou complementar sobre o mesmo tema."
    },
    {
      text: "A prática de exercícios é saudável, __________ seja feita com orientação profissional.",
      options: ["contanto que", "portanto", "então", "pois"],
      correct: 0,
      explanation: "'Contanto que' estabelece uma condição necessária para que a prática seja saudável."
    },
    {
      text: "O preconceito linguístico é real. __________, muitos brasileiros são julgados pelo seu sotaque.",
      options: ["A exemplo de", "Dessa forma", "Mas", "Apesar de"],
      correct: 1,
      explanation: "'Dessa forma' conecta a afirmação inicial à consequência ou exemplo prático citado."
    },
    {
      text: "O trabalho infantil deve ser erradicado. __________, a fiscalização precisa ser intensificada.",
      options: ["Sob essa ótica", "Entretanto", "Embora", "Contudo"],
      correct: 0,
      explanation: "'Sob essa ótica' reforça a perspectiva de erradicação através da fiscalização."
    },
    {
      text: "A arte imita a vida. __________, os problemas sociais são refletidos no cinema.",
      options: ["Assim sendo", "Todavia", "Embora", "No entanto"],
      correct: 0,
      explanation: "'Assim sendo' conclui que os problemas aparecem no cinema como reflexo da vida."
    },
    {
      text: "Muitos buscam a felicidade no consumo. __________, esse sentimento costuma ser efêmero.",
      options: ["Ademais", "Contudo", "Pois", "Logo"],
      correct: 1,
      explanation: "'Contudo' marca a oposição entre a busca pela felicidade e a efemeridade do consumo."
    },
    {
      text: "O sedentarismo é um risco à saúde. __________, ele contribui para o aumento da obesidade.",
      options: ["Em virtude de", "Inclusive", "Todavia", "Mas"],
      correct: 1,
      explanation: "'Inclusive' adiciona uma informação que reforça o risco citado."
    },
    {
      text: "A leitura expande horizontes. __________, ela estimula o senso crítico dos jovens.",
      options: ["Outrossim", "Contudo", "Ainda que", "Porém"],
      correct: 0,
      explanation: "'Outrossim' (também/igualmente) adiciona mais um benefício da leitura."
    },
    {
      text: "O saneamento básico é um direito. __________, o investimento estatal é indispensável.",
      options: ["Logo", "Mas", "Embora", "Entretanto"],
      correct: 0,
      explanation: "'Logo' fecha o raciocínio indicando a conclusão lógica do direito citado."
    }
  ];

  const handleOptionClick = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);
    if (index === questions[currentStep].correct) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setCurrentStep(s => s + 1);
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
  };

  if (currentStep >= questions.length) {
    return (
      <div className="p-8 rounded-[2.5rem] border-2 border-green-600/20 bg-[var(--paper)] text-center shadow-sm">
        <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
          <Trophy className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="font-['Fraunces'] text-3xl font-black text-green-700 mb-2 italic">Treinamento Concluído!</h3>
        <p className="text-[var(--ink-2)] font-bold mb-8">
          Você acertou {score} de {questions.length} questões.
        </p>
        <button 
          onClick={resetQuiz}
          className="px-8 py-5 rounded-2xl bg-green-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-lg"
        >
          TREINAR NOVAMENTE
        </button>
      </div>
    );
  }

  const q = questions[currentStep];

  return (
    <div className="p-8 rounded-[2.5rem] border border-[var(--line)] bg-[var(--paper)] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-['Fraunces'] text-xl font-black text-green-700 flex items-center gap-2 italic">
          <Play className="w-6 h-6" /> Treino de Conectivos ({currentStep + 1}/{questions.length})
        </h3>
        <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest border border-green-100 shadow-inner">
          Score: {score}
        </div>
      </div>

      <div className="mb-8">
        <p className="text-lg font-bold text-[var(--ink)] leading-relaxed">
          Qual conectivo melhor preenche a lacuna? <br/>
          <span className="text-[var(--ink-2)] mt-4 block italic bg-[var(--paper-2)] p-6 rounded-2xl border border-[var(--line)]/50 shadow-inner">
            "{q.text}"
          </span>
        </p>
      </div>

      <div className="grid gap-3 mb-8">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isSelected = i === selectedOption;
          
          return (
            <button 
              key={opt} 
              onClick={() => handleOptionClick(i)}
              disabled={showFeedback}
              className={cn(
                "w-full p-5 rounded-2xl border transition-all text-left text-sm font-black flex items-center justify-between shadow-sm",
                !showFeedback && "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-green-600/50 hover:bg-green-50",
                showFeedback && isCorrect && "border-green-600 bg-green-50 text-green-700",
                showFeedback && isSelected && !isCorrect && "border-[var(--red)] bg-[var(--red)]/5 text-[var(--red)]",
                showFeedback && !isSelected && !isCorrect && "opacity-40 border-[var(--line)] bg-[var(--paper-2)]"
              )}
            >
              {opt}
              {showFeedback && isCorrect && <Check className="w-5 h-5" />}
              {showFeedback && isSelected && !isCorrect && <X className="w-5 h-5" />}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className={cn(
            "p-6 rounded-2xl mb-8 border shadow-inner",
            selectedOption === q.correct ? "bg-green-50 border-green-200" : "bg-[var(--red)]/5 border-[var(--red)]/20"
          )}>
            <div className="flex items-center gap-2 mb-2 font-black uppercase text-[10px] tracking-[0.2em]">
              {selectedOption === q.correct ? (
                <><Check className="w-4 h-4 text-green-700" /> Excelente!</>
              ) : (
                <><X className="w-4 h-4 text-[var(--red)]" /> Atenção!</>
              )}
            </div>
            <p className="text-sm font-bold text-[var(--ink-2)] italic">
              {q.explanation}
            </p>
          </div>
          
          <button 
            onClick={nextQuestion}
            className="w-full py-5 rounded-2xl bg-[var(--ink)] text-[var(--paper)] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {currentStep === questions.length - 1 ? "VER RESULTADO" : "PRÓXIMA QUESTÃO"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function RepertoriosLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState("todos");
  const [activeEixo, setActiveEixo] = useState("todos");
  const [showGenerator, setShowGenerator] = useState(false);


  const types = [
    { id: "todos", label: "Todos" },
    { id: "leis", label: "Leis e documentos" },
    { id: "filosofia", label: "Filosofia e sociologia" },
    { id: "brasileiros", label: "Pensadores brasileiros" },
    { id: "literatura", label: "Literatura" },
    { id: "cinema", label: "Filmes e séries" },
    { id: "historia", label: "História" },
    { id: "ciencia", label: "Ciência e sociedade" }
  ];

  const eixos = [
    { id: "todos", label: "Todos os eixos" },
    { id: "educacao", label: "Educação" },
    { id: "desigualdade", label: "Desigualdade social" },
    { id: "cidadania", label: "Cidadania e direitos" },
    { id: "racismo", label: "Racismo e preconceito" },
    { id: "tecnologia", label: "Tecnologia" },
    { id: "meio-ambiente", label: "Meio ambiente" },
    { id: "saude", label: "Saúde" },
    { id: "cultura", label: "Cultura" }
  ];

  const repertorios = [
    {
      id: "cf88",
      titulo: "Constituição Federal de 1988",
      autorOuOrigem: "Brasil",
      tipo: "leis",
      ideiaCentral: "A Constituição estabelece direitos fundamentais e responsabilidades do Estado brasileiro.",
      eixosTematicos: ["cidadania", "educacao", "saude", "meio-ambiente", "direitos"],
      comoUsar: "Pode fundamentar argumentos que mostrem a distância entre os direitos previstos e a realidade enfrentada pela população.",
      modeloAdaptavel: "A Constituição Federal de 1988 prevê a garantia de direitos fundamentais à população brasileira. Entretanto, essa determinação ainda não se concretiza plenamente quando se observa [PROBLEMA DO TEMA], uma vez que [EXPLICAÇÃO DO ARGUMENTO].",
      alerta: "Não escreva apenas que “a Constituição garante tudo”. Especifique o direito relacionado ao tema e explique como ele está sendo desrespeitado.",
      icon: BookOpen
    },
    {
      id: "bauman",
      titulo: "Modernidade Líquida",
      autorOuOrigem: "Zygmunt Bauman",
      tipo: "filosofia",
      ideiaCentral: "O conceito representa uma sociedade marcada por relações e comportamentos menos estáveis e mais sujeitos a mudanças rápidas.",
      eixosTematicos: ["cultura", "tecnologia", "saude"],
      comoUsar: "Explicar a fragilidade das relações contemporâneas ou a volatilidade de comportamentos sociais.",
      modeloAdaptavel: "O sociólogo Zygmunt Bauman utiliza o conceito de modernidade líquida para explicar a fragilidade e a instabilidade presentes nas relações contemporâneas. Essa análise pode ser relacionada a [TEMA], visto que [EXPLICAÇÃO DA INSTABILIDADE].",
      icon: Lightbulb
    },
    {
      id: "vidas-secas",
      titulo: "Vidas Secas",
      autorOuOrigem: "Graciliano Ramos",
      tipo: "literatura",
      ideiaCentral: "A obra retrata uma família submetida à pobreza, à migração, à fome e à desumanização.",
      eixosTematicos: ["desigualdade", "meio-ambiente", "cidadania"],
      comoUsar: "Mostrar a invisibilidade social e a negação de direitos básicos a grupos marginalizados.",
      modeloAdaptavel: "Em 'Vidas Secas', Graciliano Ramos apresenta personagens afetados pela pobreza e pela ausência de condições básicas de sobrevivência. Fora da ficção, essa realidade relaciona-se a [TEMA], pois [EXPLICAÇÃO SOBRE O GRUPO AFETADO].",
      icon: BookOpen
    },
    {
      id: "truman",
      titulo: "O Show de Truman",
      autorOuOrigem: "Peter Weir",
      tipo: "cinema",
      ideiaCentral: "O filme apresenta uma vida transformada em espetáculo e controlada sem o conhecimento do protagonista.",
      eixosTematicos: ["tecnologia", "cultura"],
      comoUsar: "Discutir privacidade, exposição digital e manipulação mediática.",
      modeloAdaptavel: "No filme 'O Show de Truman', a vida do protagonista é exposta e controlada como parte de um espetáculo. De modo semelhante, [TEMA] evidencia como [RELAÇÃO COM EXPOSIÇÃO OU MANIPULAÇÃO].",
      icon: Play
    }
    // Adicionaria os outros 75+ aqui em uma base de dados real
  ];

  const filtered = repertorios.filter(r => {
    const matchesSearch = r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.autorOuOrigem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.ideiaCentral.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === "todos" || r.tipo === activeType;
    const matchesEixo = activeEixo === "todos" || r.eixosTematicos.includes(activeEixo);
    return matchesSearch && matchesType && matchesEixo;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header com Botão do Gerador */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--paper)] p-8 rounded-[2.5rem] border border-[var(--line)] shadow-sm">
        <div>
          <h2 className="font-['Fraunces'] text-3xl font-black text-[var(--ink)] italic">Biblioteca de Repertórios</h2>
          <p className="text-[var(--ink-2)] mt-2 font-medium">Use modelos prontos ou crie um exclusivo com nossa IA.</p>
        </div>
        <button 
          onClick={() => setShowGenerator(true)}
          className="flex items-center gap-2 px-6 py-4 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-lg"
        >
          <Sparkles className="w-5 h-5 text-[var(--red)]" />
          CRIAR COM IA
        </button>
      </div>

      {showGenerator && <RepertorioIA onClose={() => setShowGenerator(false)} />}

      {/* Search and Filters */}

      <div className="flex flex-col gap-6 p-6 md:p-10 rounded-[2.5rem] bg-[var(--paper)] border border-[var(--line)] shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--ink-3)]" />
          <input 
            type="text" 
            placeholder="Pesquise por autor, obra, tema ou argumento..."
            className="w-full pl-14 pr-4 py-5 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] outline-none transition-all font-bold text-lg text-[var(--ink)] placeholder:text-[var(--ink-3)]/40 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="space-y-6">
          <div>
            <span className="text-[9px] font-black uppercase text-[var(--ink-3)] tracking-[0.2em] block mb-3 ml-1">Filtrar por Tipo</span>
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveType(t.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                    activeType === t.id 
                      ? "bg-[var(--ink)] text-[var(--paper)] border border-[var(--ink)]" 
                      : "bg-[var(--paper-2)] text-[var(--ink-3)] hover:text-[var(--ink)] border border-[var(--line)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[9px] font-black uppercase text-[var(--ink-3)] tracking-[0.2em] block mb-3 ml-1">Filtrar por Eixo Temático</span>
            <div className="flex flex-wrap gap-2">
              {eixos.map(e => (
                <button
                  key={e.id}
                  onClick={() => setActiveEixo(e.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                    activeEixo === e.id 
                      ? "bg-[var(--red)] text-white border-[var(--red)]" 
                      : "bg-[var(--paper-2)] border-[var(--line)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                  )}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Repertórios Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filtered.map((r) => (
          <div key={r.id} className="p-8 rounded-[2.5rem] border border-[var(--line)] bg-[var(--paper)] hover:border-[var(--red)]/40 transition-all flex flex-col md:flex-row gap-8 shadow-sm group/card">
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-['Fraunces'] text-2xl font-black text-[var(--ink)] tracking-tight italic">{r.titulo}</h3>
                  <p className="text-[10px] font-black text-[var(--red)] uppercase tracking-[0.2em]">{r.autorOuOrigem}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-3)] text-[9px] font-black uppercase tracking-widest shadow-inner">
                  {r.tipo}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-[var(--ink-3)] tracking-widest block mb-1">Ideia Central</span>
                  <p className="text-[var(--ink)] font-medium leading-relaxed">{r.ideiaCentral}</p>
                </div>

                <div>
                  <span className="text-[9px] font-black uppercase text-[var(--ink-3)] tracking-widest block mb-1">Como relacionar à redação</span>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">{r.comoUsar}</p>
                </div>

                <div className="p-6 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] relative group shadow-inner">
                  <span className="text-[9px] font-black uppercase text-[var(--red)] tracking-widest block mb-3">Modelo Adaptável</span>
                  <p className="text-sm font-bold italic text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
                    "{r.modeloAdaptavel.split(/(\[.*?\])/).map((part, i) => 
                      part.startsWith('[') ? <span key={i} className="text-[var(--red)] font-black bg-[var(--red)]/10 px-1 rounded">{part}</span> : part
                    )}"
                  </p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(r.modeloAdaptavel)}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-3)] hover:text-[var(--red)] transition-colors shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {r.alerta && (
                  <div className="flex items-start gap-2 text-amber-600 text-[10px] font-black uppercase tracking-tight p-3 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Atenção: {r.alerta}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-64 space-y-4">
              <div className="p-6 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] shadow-inner">
                <span className="text-[9px] font-black uppercase text-[var(--ink-3)] tracking-widest block mb-3">Eixos Temáticos</span>
                <div className="flex flex-wrap gap-2">
                  {r.eixosTematicos.map(e => (
                    <span key={e} className="px-2 py-1 rounded-md bg-[var(--paper)] border border-[var(--line)] text-[9px] font-black uppercase tracking-tighter text-[var(--ink)] shadow-sm">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seção 15: Erros Comuns */}
      <div className="mt-12 p-8 rounded-[2rem] border-2 border-destructive/20 bg-destructive/5">
        <h3 className="text-xl font-black text-destructive mb-6 flex items-center gap-2">
          <X className="w-6 h-6" /> O que pode enfraquecer seu repertório
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-black text-foreground text-sm uppercase tracking-widest">Apenas mencionar o autor</h4>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs italic">
              "Segundo Bauman, vivemos em uma modernidade líquida."
            </div>
            <p className="text-xs text-muted-foreground font-bold">O estudante apresentou o conceito, mas não explicou sua relação com o tema.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-[#22c55e] text-sm uppercase tracking-widest">Forma ideal</h4>
            <div className="p-4 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 text-xs italic">
              "Segundo Bauman, a modernidade líquida é marcada pela fragilidade das relações. Essa análise relaciona-se à exposição digital infantil, pois a busca por aprovação nas plataformas..."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const REPERTORIO_LOADING_STEPS = [
  "Interpretando o seu tema...",
  "Buscando repertórios legitimados...",
  "Filtrando o que os corretores mais valorizam...",
  "Conectando o repertório ao seu argumento...",
  "Montando o exemplo pronto para usar...",
];

function RepertorioAnalyzing() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % REPERTORIO_LOADING_STEPS.length);
    }, 2200);

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + Math.random() * 6));
    }, 450);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 py-4">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-[var(--red)]/10 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-[var(--red)]/20 border-t-[var(--red)] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-[var(--red)] animate-pulse" />
          </div>
        </div>
        <h3 className="font-['Fraunces'] text-2xl font-black text-[var(--ink)] italic">IA analisando seu tema</h3>
        <p className="text-sm font-bold text-[var(--ink-3)] mt-1">Isso leva só alguns segundos. Não feche esta janela.</p>
      </div>

      <div className="space-y-3">
        <div className="h-3 w-full rounded-full bg-[var(--paper-2)] overflow-hidden border border-[var(--line)] shadow-inner">
          <div
            className="h-full rounded-full bg-[var(--ink)] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--ink)] text-center">
          {Math.round(Math.min(progress, 95))}% concluído
        </p>
      </div>

      <div className="space-y-2">
        {REPERTORIO_LOADING_STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 shadow-sm",
              i < index
                ? "bg-green-50 border-green-200 text-[var(--ink)]"
                : i === index
                  ? "bg-[var(--red)]/5 border-[var(--red)]/20 text-[var(--ink)]"
                  : "bg-[var(--paper-2)] border-[var(--line)] text-[var(--ink-3)] opacity-60",
            )}
          >
            {i < index ? (
              <Check className="w-4 h-4 text-green-700 shrink-0" />
            ) : i === index ? (
              <div className="w-4 h-4 shrink-0 rounded-full border-2 border-[var(--red)]/20 border-t-[var(--red)] animate-spin" />
            ) : (
              <div className="w-4 h-4 shrink-0 rounded-full border border-[var(--line)]" />
            )}
            <span className="text-xs font-bold leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepertorioIA({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tema, setTema] = useState("");
  const [genero, setGenero] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [historico, setHistorico] = useState<{role: "user" | "assistant", content: string}[]>([]);
  const [currentResponse, setCurrentResponse] = useState<RespostaRepertorio | null>(null);
  const criarRep = useServerFn(criarRepertorio);

  const handleGenerate = async (extraDetails?: string) => {
    console.log("Iniciando handleGenerate com:", { tema, genero, extraDetails });
    setLoading(true);
    try {
      console.log("Chamando criarRep RPC...");
      const res = await criarRep({ 
        data: {
          tema, 
          genero, 
          detalhes: extraDetails || detalhes,
          historico: historico
        }
      });
      console.log("Resposta da IA recebida:", res);

      setCurrentResponse(res);
      setHistorico(prev => [...prev, 
        { role: "user", content: extraDetails || `Tema: ${tema}, Gênero: ${genero}` },
        { role: "assistant", content: res.message }
      ]);
      if (res.repertorio) {
        console.log("Repertório pronto, mudando para step 3");
        setStep(3); // Resultado final
      } else if (res.proximaPergunta) {
        console.log("IA enviou próxima pergunta, mudando para step 2");
        setStep(2); // Continua funilando
      } else {
        console.warn("IA não enviou nem repertório nem pergunta, permanecendo no step 2");
        setStep(2);
      }
    } catch (e: any) {
      console.error("Erro detalhado no handleGenerate:", e);
      // Extrair mensagem de erro se disponível
      const errorMsg = e.message || "Houve um erro ao gerar o repertório.";
      alert(`Erro: ${errorMsg}\n\nPor favor, tente novamente em alguns segundos.`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setTema("");
    setGenero("");
    setDetalhes("");
    setHistorico([]);
    setCurrentResponse(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border-2 border-primary/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-12 overflow-y-auto">
          {loading && <RepertorioAnalyzing />}
          {!loading && step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-black mb-2">Gerador de Repertório IA</h3>
                <p className="text-muted-foreground font-medium">Vamos criar o repertório perfeito para o seu texto.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-primary tracking-widest block mb-2 ml-1">Sobre o que é seu texto? (Tema)</label>
                  <input 
                    value={tema}
                    onChange={e => setTema(e.target.value)}
                    placeholder="Ex: O impacto das redes sociais na saúde mental dos jovens"
                    className="w-full px-6 py-4 rounded-2xl bg-muted/30 border border-border focus:border-primary outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-primary tracking-widest block mb-2 ml-1">Alguma preferência de gênero?</label>
                  <select 
                    value={genero}
                    onChange={e => setGenero(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-muted/30 border border-border focus:border-primary outline-none transition-all font-black uppercase text-xs tracking-widest"
                  >
                    <option value="">Nenhuma (IA escolhe)</option>
                    <option value="filosofia">Filosofia/Sociologia</option>
                    <option value="literatura">Literatura</option>
                    <option value="cinema">Cinema/Séries</option>
                    <option value="historia">História</option>
                    <option value="atualidades">Fatos e Notícias</option>
                  </select>
                </div>
                <button 
                  disabled={!tema || loading}
                  onClick={(e) => {
                    console.log("Clique detectado no COMEÇAR FUNIL");
                    handleGenerate();
                  }}
                  className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <><Zap className="w-5 h-5" /> COMEÇAR FUNIL</>}
                </button>
              </div>
            </div>
          )}

          {!loading && step === 2 && currentResponse && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start gap-4 p-6 rounded-3xl bg-primary/5 border border-primary/20">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-relaxed">
                    {currentResponse.message}
                  </p>
                </div>
              </div>

              {currentResponse.proximaPergunta && (
                <div className="space-y-4">
                  <textarea 
                    value={detalhes}
                    onChange={e => setDetalhes(e.target.value)}
                    placeholder="Sua resposta aqui..."
                    className="w-full px-6 py-4 rounded-2xl bg-[var(--paper-2)]/50 border border-[var(--line)] focus:border-[var(--red)] outline-none transition-all font-bold min-h-[120px] resize-none text-[var(--ink)] placeholder:text-[var(--ink-3)]/40 shadow-inner"
                  />
                  <button 
                    disabled={!detalhes || loading}
                    onClick={() => {
                      console.log("Clique detectado no CONTINUAR ANÁLISE");
                      handleGenerate();
                    }}
                    className="w-full py-5 rounded-2xl bg-[var(--ink)] text-[var(--paper)] font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--paper)]/30 border-t-[var(--paper)]" /> : "CONTINUAR ANÁLISE"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && step === 3 && currentResponse?.repertorio && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#22c55e]" />
                </div>
                <h3 className="text-2xl font-black">Repertório Finalizado!</h3>
                <p className="text-muted-foreground font-medium italic">"{currentResponse.message}"</p>
              </div>

              <div className="space-y-6">
                <div className="p-8 rounded-[2rem] bg-[var(--paper)] border-2 border-[var(--red)]/20 relative group shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-['Fraunces'] text-2xl font-black text-[var(--red)] tracking-tight italic">{currentResponse.repertorio.titulo}</h4>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--ink-3)]">{currentResponse.repertorio.autor}</p>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`${currentResponse.repertorio!.titulo} - ${currentResponse.repertorio!.autor}\n\n${currentResponse.repertorio!.exemplo}`)}
                      className="p-3 rounded-xl bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--red)] transition-all shadow-sm"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[9px] font-black uppercase text-[var(--ink-3)] tracking-[0.2em] block mb-1">Conceito Chave</span>
                      <p className="text-sm font-bold text-[var(--ink)] leading-relaxed">{currentResponse.repertorio.ideia}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-[var(--ink-3)] tracking-[0.2em] block mb-1">Uso Produtivo</span>
                      <p className="text-sm font-bold text-[var(--ink)] leading-relaxed">{currentResponse.repertorio.relacao}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] shadow-inner italic">
                      <span className="text-[9px] font-black uppercase text-[var(--red)] tracking-[0.2em] block mb-2 not-italic">Exemplo no Texto</span>
                      <p className="text-sm font-medium text-[var(--ink)] leading-relaxed">"{currentResponse.repertorio.exemplo}"</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={reset}
                    className="flex-1 py-4 rounded-xl bg-[var(--paper-2)] font-black text-[10px] uppercase tracking-[0.2em] text-[var(--ink-2)] hover:bg-[var(--line)] transition-all border border-[var(--line)] shadow-sm"
                  >
                    CRIAR OUTRO
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 py-4 rounded-xl bg-[var(--red)] text-white font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-lg"
                  >
                    FECHAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, onClick, color }: any) {

  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 rounded-3xl border border-[var(--line)] bg-[var(--paper-2)]/30 hover:bg-[var(--paper-2)] hover:border-[var(--red)]/30 transition-all hover:scale-105 group shadow-sm"
    >
      <div className={`p-4 rounded-2xl ${color} mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
        <Icon className="w-8 h-8" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--ink-3)] mb-1">{label}</span>
      <span className="text-2xl font-black tracking-tight text-[var(--ink)]">{value}</span>
    </button>
  );
}

interface LockedLibraryOfferProps {
  titulo: string;
  descricao: string;
  itens: string[];
  onBuy: () => void;
  onSeePlans: () => void;
}

function LockedLibraryOffer({ titulo, descricao, itens, onBuy, onSeePlans }: LockedLibraryOfferProps) {
  return (
    <div className="relative -mt-2">
      <div className="rounded-[2.5rem] border-2 border-[var(--red)]/40 bg-[var(--paper)] p-6 md:p-10 shadow-[0_30px_60px_-15px_rgba(196,50,42,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Sparkles className="w-64 h-64 text-[var(--red)]" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--red)] text-white text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" /> Acesso liberado no Combo Nota 1000
        </div>


        <h3 className="font-['Fraunces'] text-2xl md:text-4xl font-black tracking-tight mb-3 text-[var(--ink)] italic">{titulo}</h3>
        <p className="text-base text-[var(--ink-2)] font-medium leading-relaxed mb-8 max-w-2xl">{descricao}</p>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {itens.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm md:text-base font-bold text-[var(--ink)]">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-green-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col md:flex-row md:items-center gap-8 pt-8 border-t border-[var(--line)]">
          <div>
            <p className="whitespace-nowrap text-sm text-[var(--ink-3)] line-through font-bold italic">De R$ 59,90</p>
            <p className="whitespace-nowrap text-5xl font-black text-[var(--ink)] leading-none mt-1 tracking-tight">R$ 39,00</p>
            <p className="text-[10px] text-[var(--red)] font-black uppercase tracking-[0.2em] mt-3">Pagamento único • acesso vitalício</p>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-3 md:justify-end">
            <button
              onClick={onBuy}
              className="px-8 py-5 rounded-2xl bg-[var(--red)] text-white font-black text-sm uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(196,50,42,0.4)]"
            >
              Liberar acesso agora
            </button>
            <button
              onClick={onSeePlans}
              className="px-6 py-4 rounded-xl border border-border text-muted-foreground font-bold text-sm hover:text-foreground hover:border-primary/40 transition-colors"
            >
              Ver todos os planos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProgressSectionProps {
  essays: any[];
  onGoToCorrection: () => void;
}

function ProgressSection({ essays, onGoToCorrection }: ProgressSectionProps) {
  const ordenadas = [...essays]
    .filter((e) => e?.resultado?.nota_total != null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (ordenadas.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-bold">Ainda não há dados de progresso.</p>
          <button onClick={onGoToCorrection} className="mt-4 text-primary font-black hover:underline">
            Enviar minha primeira redação →
          </button>
        </div>
      </div>
    );
  }

  const notas = ordenadas.map((e) => Number(e.resultado.nota_total) || 0);
  const media = Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);
  const melhor = Math.max(...notas);
  const ultima = notas[notas.length - 1];
  const primeira = notas[0];
  const evolucao = ultima - primeira;

  const chartData = ordenadas.map((e, i) => ({
    nome: `#${i + 1}`,
    nota: Number(e.resultado.nota_total) || 0,
    data: new Date(e.created_at).toLocaleDateString("pt-BR"),
  }));

  const competencias = [1, 2, 3, 4, 5].map((numero) => {
    const valores = ordenadas
      .map((e) => (e.resultado?.competencias || []).find((c: any) => c.numero === numero)?.nota)
      .filter((n: any) => typeof n === "number");
    const mediaComp = valores.length ? Math.round(valores.reduce((a: number, b: number) => a + b, 0) / valores.length) : 0;
    return { nome: `C${numero}`, media: mediaComp };
  });

  const cards = [
    { label: "Média geral", valor: media, cor: "text-[var(--red)]" },
    { label: "Melhor nota", valor: melhor, cor: "text-green-600" },
    { label: "Última nota", valor: ultima, cor: "text-[var(--ink)]" },
    { label: "Redações corrigidas", valor: ordenadas.length, cor: "text-[var(--ink-2)]" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="font-['Fraunces'] text-3xl font-black flex items-center gap-3 text-[var(--ink)] italic">
          <TrendingUp className="w-8 h-8 text-green-600" />
          Meu Progresso
        </h2>
        <p className="text-[var(--ink-2)] mt-2 font-medium">Acompanhe a evolução das suas notas e onde você mais precisa treinar.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]/50 p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-3)] font-black mb-2">{c.label}</p>
            <p className={cn("text-3xl font-black tabular-nums", c.cor)}>{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-4 md:p-8 mb-8 shadow-sm">
        <h3 className="font-['Fraunces'] text-xl font-black mb-1 text-[var(--ink)]">Evolução das notas</h3>
        <p className="text-sm text-[var(--ink-2)] font-bold mb-6 italic">
          {evolucao >= 0
            ? `Você subiu ${evolucao} pontos desde a primeira correção.`
            : `Você caiu ${Math.abs(evolucao)} pontos desde a primeira correção. Bora treinar.`}
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="nome" stroke="var(--ink-3)" tick={{ fill: "var(--ink-3)", fontWeight: 700 }} fontSize={12} />
              <YAxis domain={[0, 1000]} stroke="var(--ink-3)" tick={{ fill: "var(--ink-3)", fontWeight: 700 }} fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  color: "var(--ink)",
                }}
                itemStyle={{ color: "var(--ink)", fontWeight: 700 }}
                labelStyle={{ color: "var(--ink)", fontWeight: 700 }}
                formatter={(value: any) => [`${value} pontos`, "Nota"]}
                labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.data || label}
              />
              <Line type="monotone" dataKey="nota" stroke="var(--red)" strokeWidth={3} dot={{ r: 4, fill: "var(--red)", stroke: "var(--red)" }} activeDot={{ r: 6, fill: "var(--red)" }} />

            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-4 md:p-8 shadow-sm">
        <h3 className="font-['Fraunces'] text-xl font-black mb-1 text-[var(--ink)]">Média por competência</h3>
        <p className="text-sm text-[var(--ink-2)] font-bold mb-6 italic">Cada competência vale até 200 pontos no ENEM.</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={competencias} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="nome" stroke="var(--ink-3)" tick={{ fill: "var(--ink-3)", fontWeight: 700 }} fontSize={12} />
              <YAxis domain={[0, 200]} stroke="var(--ink-3)" tick={{ fill: "var(--ink-3)", fontWeight: 700 }} fontSize={12} />
              <Tooltip
                cursor={{ fill: "var(--paper-2)" }}
                contentStyle={{
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  color: "var(--ink)",
                }}
                itemStyle={{ color: "var(--ink)", fontWeight: 700 }}
                labelStyle={{ color: "var(--ink)", fontWeight: 700 }}
                formatter={(value: any) => [`${value} / 200`, "Média"]}
              />
              <Bar dataKey="media" fill="var(--red)" radius={[8, 8, 0, 0]} />

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
