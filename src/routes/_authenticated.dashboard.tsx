import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analisarConectivos, criarRepertorio } from "@/lib/correct-essay.functions";
import { supabase } from "@/integrations/supabase/client";
import { type Correcao, type RespostaRepertorio } from "@/lib/correct-essay.functions";
import { EssaySubmissionArea } from "@/components/EssaySubmissionArea";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
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
  MessageSquare
} from "lucide-react";

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

      const uniqueEssays = (essayRes.data || []).reduce((acc: any[], current: any) => {
        const x = acc.find(item => item.tema === current.tema && item.redacao === current.redacao);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
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
    if (profile?.id) {
      // Cast to any to bypass temporary TS errors until types regenerate
      const updates: any = type === 'full' 
        ? { is_pro: true, has_full_access: true }
        : { is_pro: true };
        
      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
      if (error) {
        console.error("Erro ao ativar acesso:", error);
        return;
      }
      setProfile({ ...profile, ...updates });
      window.location.reload();
    }
  };



  if (loading) {
    return (
      <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex">
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4">
                  <Trophy className="w-3 h-3" /> Dashboard Estudante
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                  Olá, <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'Estudante'}</span>! ✍️
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                  Pronto para a nota 1000 hoje? Cole seu texto abaixo para começar a correção.
                </p>

                <div className="max-w-3xl mx-auto">
                  <EssaySubmissionArea 
                    isLoggedIn={true} 
                    onSuccess={() => {
                      const loadEssays = async () => {
                        const { data } = await supabase.from("essays").select("*").order("created_at", { ascending: false });
                        const currentEssays = data || [];
                        
                        // Sistema de limite de 50 redações
                        if (currentEssays.length > 50) {
                          const toDelete = currentEssays.slice(50);
                          const deleteIds = toDelete.map(e => e.id);
                          await supabase.from("essays").delete().in("id", deleteIds);
                          setEssays(currentEssays.slice(0, 50));
                        } else {
                          setEssays(currentEssays);
                        }
                      };
                      loadEssays();
                    }}
                  />
                </div>
              </div>


              {!profile?.is_pro && (
                <div className="rounded-3xl border-2 border-secondary/40 bg-secondary/5 p-8 relative overflow-hidden mt-12">
                  <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="p-4 rounded-2xl bg-secondary/20 text-secondary">
                      <Sparkles className="w-12 h-12" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-black mb-2">Treino Ilimitado e VIP</h3>
                      <p className="text-muted-foreground">Desbloqueie correções ilimitadas e todas as ferramentas PRO por apenas R$ 24,90.</p>
                    </div>
                    <button 
                      onClick={() => setActiveSection("upgrade")}
                      className="px-8 py-4 rounded-xl bg-secondary text-secondary-foreground font-black hover:scale-105 transition-transform"
                    >
                      ATIVAR PRO AGORA
                    </button>
                  </div>
                </div>
              )}
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
                onSuccess={() => {
                  const loadEssays = async () => {
                    const { data } = await supabase.from("essays").select("*").order("created_at", { ascending: false });
                    const currentEssays = data || [];
                    
                    // Sistema de limite de 50 redações
                    if (currentEssays.length > 50) {
                      const toDelete = currentEssays.slice(50);
                      const deleteIds = toDelete.map(e => e.id);
                      await supabase.from("essays").delete().in("id", deleteIds);
                      setEssays(currentEssays.slice(0, 50));
                    } else {
                      setEssays(currentEssays);
                    }
                  };
                  loadEssays();
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
                      className="rounded-2xl border border-border bg-card p-4 md:p-6 hover:border-primary/50 transition-all hover:scale-[1.01] cursor-pointer group w-full box-border overflow-hidden"
                    >
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                            {new Date(essay.created_at).getDate()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold truncate group-hover:text-primary transition-colors pr-2">{essay.tema}</h3>
                            <p className="text-[10px] md:text-xs text-muted-foreground">
                              {new Date(essay.created_at).toLocaleDateString('pt-BR')} • {essay.redacao.length} caracteres
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-black text-primary shrink-0">
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
                      Corrigir meu primeiro texto agora →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "upgrade" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="p-6 rounded-3xl bg-secondary/10 border-2 border-secondary/20 mb-8 inline-block">
                  <Sparkles className="w-16 h-16 text-secondary animate-pulse" />
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tight">Garanta seu Futuro 🚀</h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Garanta correções ilimitadas e acesso vitalício a todas as ferramentas do CorrigeAI.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-12">
                   {/* PLANO VITALÍCIO - Básico */}
                  <div className="flex flex-col rounded-3xl border-2 border-white/20 bg-white/10 p-8 relative overflow-hidden group hover:opacity-100 transition-opacity">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                        <Zap className="w-6 h-6 text-[#22c55e]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[#22c55e] leading-tight uppercase tracking-tight">Acesso Vitalício</h3>
                        <p className="text-xs font-bold text-[#22c55e]/60 leading-tight">Plano Básico</p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-3 text-sm font-bold text-[#22c55e]">
                        <span className="shrink-0">✓</span>
                        <span>Correções de redação ilimitadas</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-bold text-[#22c55e]">
                        <span className="shrink-0">✓</span>
                        <span>Histórico completo de evolução</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-bold text-white/40">
                        <span className="text-destructive shrink-0">✕</span>
                        <span className="line-through">70+ Repertórios Universais</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-bold text-white/40">
                        <span className="text-destructive shrink-0">✕</span>
                        <span className="line-through">Flashcards de Conectivos</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-bold text-white/40">
                        <span className="text-destructive shrink-0">✕</span>
                        <span className="line-through">Manual Proposta Nota 200</span>
                      </li>
                    </ul>

                    <div className="mt-auto">
                      <div className="text-3xl font-black text-[#22c55e] mb-6">R$ 24,90</div>
                      <button
                        onClick={() => handleTestPurchase('pro')}
                        className="w-full py-4 rounded-xl bg-[#22c55e]/10 text-[#22c55e] font-black text-sm uppercase tracking-widest hover:bg-[#22c55e]/20 transition-all border border-[#22c55e]/20"
                      >
                        LIBERAR BÁSICO
                      </button>
                    </div>
                  </div>

                  {/* COMBO NOTA 1000 - Premium */}
                  <div className="flex flex-col rounded-3xl border-2 border-primary bg-primary/10 p-8 relative overflow-hidden group shadow-[0_0_60px_rgba(var(--primary-rgb),0.3)] scale-[1.05]">
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#22c55e] text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl animate-pulse z-20">
                      MELHOR ESCOLHA 🎁
                    </div>
                    
                    <div className="mb-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#22c55e] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tight">Combo Nota 1000</h3>
                        <p className="text-xs font-bold text-primary leading-tight">Acesso Total + Bônus</p>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex items-start gap-3 text-sm font-bold text-white">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                          <span className="text-primary font-black">✓</span>
                        </div>
                        <span className="text-[#22c55e] uppercase tracking-tight">Tudo do Plano Vitalício</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-bold text-white">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                          <span className="text-primary font-black">✓</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#22c55e] font-black uppercase text-[11px] tracking-wide">70+ Repertórios Coringas</span>
                          <p className="text-[12px] text-white font-bold leading-tight">Modelos universais prontos for qualquer tema do ENEM.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-bold text-white">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                          <span className="text-primary font-black">✓</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#22c55e] font-black uppercase text-[11px] tracking-wide">Domine a C4 (Conectivos)</span>
                          <p className="text-[12px] text-white font-bold leading-tight">Flashcards para nunca mais repetir palavras na redação.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 text-sm font-bold text-white">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                          <span className="text-primary font-black">✓</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#22c55e] font-black uppercase text-[11px] tracking-wide">Segredo da C5 (Nota 200)</span>
                          <p className="text-[12px] text-white font-bold leading-tight">Manual prático para fechar a proposta de intervenção.</p>
                        </div>
                      </li>
                    </ul>

                    <div className="mt-auto">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-bold text-[#22c55e]/60 line-through italic uppercase tracking-widest">R$ 59,90</span>
                        <span className="text-4xl font-black text-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">R$ 42,00</span>
                      </div>
                      <button
                        onClick={() => handleTestPurchase('full')}
                        className="w-full py-4 rounded-xl bg-[#22c55e] text-white font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 transition-all shadow-[0_12px_40px_rgba(34,197,94,0.4)] relative overflow-hidden"
                      >
                        <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        GARANTIR COMBO COMPLETO →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeSection === "repertorios" || activeSection === "conectivos") && !(profile as any)?.has_full_access && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="p-6 rounded-3xl bg-primary/10 border-2 border-primary/20 mb-8 inline-block">
                  <Sparkles className="w-16 h-16 text-primary animate-pulse" />
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tight">Área Exclusiva Pro 👑</h2>
                <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                  Ah, se você quer adquirir melhores materiais e acessar esta área exclusiva, basta acessar a aba <strong>Plano PRO</strong> para garantir o Combo Nota 1000.
                </p>
                
                <button 
                  onClick={() => setActiveSection("upgrade")}
                  className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-black text-lg hover:scale-105 transition-transform shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)]"
                >
                  VER PLANOS DISPONÍVEIS
                </button>
              </div>
            </div>
          )}

          {activeSection === "repertorios" && (profile as any)?.has_full_access && (
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
                    <p className="text-foreground font-medium italic">
                      “Um bom repertório não serve apenas para deixar a redação mais bonita. Ele deve ajudar a explicar o problema, comprovar seu argumento ou aprofundar sua análise.”
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Aviso pedagógico inicial */}
              <div className="mb-12 p-8 rounded-[2rem] border-2 border-primary/20 bg-primary/5">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-amber-500" /> Antes de usar um repertório
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-black text-foreground">Ele é verdadeiro?</h3>
                    <p className="text-sm text-muted-foreground">Não invente autores, frases, leis, filmes, pesquisas ou acontecimentos históricos.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-foreground">Ele combina com o tema?</h3>
                    <p className="text-sm text-muted-foreground">A referência precisa estar claramente relacionada ao problema discutido.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-foreground">Ele fortalece seu argumento?</h3>
                    <p className="text-sm text-muted-foreground">Não basta citar. Depois de apresentar o repertório, explique o que ele demonstra e como se conecta à sua tese.</p>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-background/50 border border-border text-sm italic text-muted-foreground">
                  Repertório coringa não significa repertório automático. A referência precisa ser adaptada ao tema e explicada dentro da argumentação.
                </div>
              </div>

              {/* Biblioteca de Repertórios Section */}
              <RepertoriosLibrary />
            </div>
          )}

          {activeSection === "conectivos" && (profile as any)?.has_full_access && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                  <Zap className="w-3 h-3" /> Material Exclusivo Order Bump
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
            className="w-full min-h-[120px] p-5 rounded-2xl bg-background border-2 border-border focus:border-primary outline-none transition-all font-bold text-sm"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleAnalyze();
            }}
            disabled={isAnalyzing || frase.length < 10}
            className={cn(
              "absolute bottom-4 right-4 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all z-20",
              isAnalyzing || frase.length < 10 
                ? "bg-muted text-muted-foreground cursor-not-allowed" 
                : "bg-primary text-primary-foreground hover:scale-105 shadow-lg active:scale-95"
            )}
          >
            Analisar Frase
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
            <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="w-full max-w-md px-8 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
              <span>IA Analisando conectivos</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/20">
              <div 
                className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground font-bold animate-pulse mt-4">
              Avaliando a coesão e buscando melhorias...
            </p>
          </div>
        </div>
      )}

      {analise && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 p-8 rounded-3xl border-2 border-border bg-card relative overflow-hidden">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                analise.status === 'bom' && "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20",
                analise.status === 'regular' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                analise.status === 'ruim' && "bg-destructive/10 text-destructive border-destructive/20",
              )}>
                Avaliação: {analise.status === 'bom' ? 'Excelente' : analise.status === 'regular' ? 'Pode Melhorar' : 'Necessita Ajuste'}
              </div>
              <button 
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-xs font-black text-primary hover:bg-primary/10 border-2 border-primary/40 hover:border-primary/60 transition-all uppercase tracking-widest flex items-center gap-2 bg-primary/5"
              >
                <PenTool className="w-3 h-3" />
                Analisar outra frase
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Análise Técnica</h4>
                <p className="text-base font-bold text-foreground leading-relaxed">
                  {analise.analise}
                </p>
              </div>

              {analise.sugestao && (
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 relative">
                  <div className="absolute top-4 right-4">
                    <Sparkles className="w-4 h-4 text-primary opacity-50" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Sugestão de Upgrade</h4>
                  <p className="text-sm text-foreground font-bold">
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
      <div className="sticky top-2 z-30 flex flex-col gap-4 p-4 rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Pesquisar conectivo ou exemplo..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold"
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
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all",
                activeCategory === cat.id 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
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
            className="group p-6 rounded-3xl border border-border bg-card hover:border-primary/40 transition-all hover:scale-[1.02] flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-black text-primary tracking-tight">{c.termo}</h4>
              <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                {c.cat}
              </span>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <p className="text-sm font-medium italic text-foreground leading-relaxed">
                  "{c.ex}"
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-2">
                  <div className="mt-1 shrink-0"><Check className="w-3 h-3 text-[#22c55e]" /></div>
                  <p className="text-xs text-muted-foreground font-bold"><span className="text-foreground">Uso:</span> {c.uso}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 shrink-0"><Lightbulb className="w-3 h-3 text-amber-500" /></div>
                  <p className="text-xs text-muted-foreground font-bold"><span className="text-foreground">Dica:</span> {c.dica}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(c.termo);
                // Simple feedback would be nice here
              }}
              className="mt-6 w-full py-3 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Copy className="w-3 h-3" /> Copiar Termo
            </button>
          </div>
        ))}
      </div>

      {/* Bonus Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="p-8 rounded-[2rem] border-2 border-destructive/20 bg-destructive/5">
          <h3 className="text-xl font-black text-destructive mb-6 flex items-center gap-2">
            <X className="w-6 h-6" /> Erros Comuns
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5 text-destructive font-black text-xs">1</div>
              <p className="text-sm font-bold text-muted-foreground">
                <strong className="text-foreground">Usar "mesmo" como pronome:</strong> "O aluno entregou a redação e o mesmo saiu." (Errado). Prefira: "ele".
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5 text-destructive font-black text-xs">2</div>
              <p className="text-sm font-bold text-muted-foreground">
                <strong className="text-foreground">Onde vs Aonde:</strong> "Onde" indica lugar fixo. "Aonde" indica movimento. Não use "onde" para substituir "no qual" em ideias abstratas.
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
      <div className="p-8 rounded-[2rem] border-2 border-[#22c55e]/20 bg-[#22c55e]/5 text-center">
        <div className="w-20 h-20 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-[#22c55e]" />
        </div>
        <h3 className="text-3xl font-black text-[#22c55e] mb-2">Treinamento Concluído!</h3>
        <p className="text-muted-foreground font-bold mb-8">
          Você acertou {score} de {questions.length} questões.
        </p>
        <button 
          onClick={resetQuiz}
          className="px-8 py-4 rounded-xl bg-[#22c55e] text-white font-black hover:scale-105 transition-all"
        >
          TREINAR NOVAMENTE
        </button>
      </div>
    );
  }

  const q = questions[currentStep];

  return (
    <div className="p-8 rounded-[2rem] border-2 border-[#22c55e]/20 bg-[#22c55e]/5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-[#22c55e] flex items-center gap-2">
          <Play className="w-6 h-6" /> Treino de Conectivos ({currentStep + 1}/{questions.length})
        </h3>
        <div className="px-3 py-1 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-black uppercase">
          Score: {score}
        </div>
      </div>

      <div className="mb-8">
        <p className="text-lg font-bold text-foreground leading-relaxed">
          Qual conectivo melhor preenche a lacuna? <br/>
          <span className="text-muted-foreground mt-4 block italic bg-background/30 p-4 rounded-xl border border-border/50">
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
                "w-full p-4 rounded-xl border-2 transition-all text-left text-sm font-black flex items-center justify-between",
                !showFeedback && "border-border bg-card hover:border-[#22c55e] hover:bg-[#22c55e]/5",
                showFeedback && isCorrect && "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]",
                showFeedback && isSelected && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                showFeedback && !isSelected && !isCorrect && "opacity-50 border-border bg-card"
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
            "p-6 rounded-2xl mb-8 border-2",
            selectedOption === q.correct ? "bg-[#22c55e]/5 border-[#22c55e]/20" : "bg-destructive/5 border-destructive/20"
          )}>
            <div className="flex items-center gap-2 mb-2 font-black uppercase text-xs tracking-wider">
              {selectedOption === q.correct ? (
                <><Check className="w-4 h-4 text-[#22c55e]" /> Acertou!</>
              ) : (
                <><X className="w-4 h-4 text-destructive" /> Errou!</>
              )}
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              {q.explanation}
            </p>
          </div>
          
          <button 
            onClick={nextQuestion}
            className="w-full py-4 rounded-xl bg-[#22c55e] text-white font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {currentStep === questions.length - 1 ? "VER RESULTADO" : "PRÓXIMA QUESTÃO"} <ArrowRight className="w-5 h-5" />
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-8 rounded-[2rem] border border-border">
        <div>
          <h2 className="text-3xl font-black text-foreground">Biblioteca de Repertórios</h2>
          <p className="text-muted-foreground mt-2 font-medium">Use modelos prontos ou crie um exclusivo com nossa IA.</p>
        </div>
        <button 
          onClick={() => setShowGenerator(true)}
          className="flex items-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
        >
          <Sparkles className="w-5 h-5" />
          CRIAR COM IA
        </button>
      </div>

      {showGenerator && <RepertorioIA onClose={() => setShowGenerator(false)} />}

      {/* Search and Filters */}

      <div className="flex flex-col gap-6 p-4 md:p-8 rounded-[2rem] bg-card border border-border">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Pesquise por autor, obra, tema ou argumento..."
            className="w-full pl-14 pr-4 py-5 rounded-2xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] block mb-3 ml-1">Filtrar por Tipo</span>
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveType(t.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeType === t.id 
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" 
                      : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] block mb-3 ml-1">Filtrar por Eixo Temático</span>
            <div className="flex flex-wrap gap-2">
              {eixos.map(e => (
                <button
                  key={e.id}
                  onClick={() => setActiveEixo(e.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                    activeEixo === e.id 
                      ? "bg-secondary text-secondary-foreground border-secondary shadow-[0_0_15px_rgba(var(--secondary-rgb),0.4)]" 
                      : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
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
          <div key={r.id} className="p-8 rounded-[2rem] border border-border bg-card hover:border-primary/40 transition-all flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight">{r.titulo}</h3>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest">{r.autorOuOrigem}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                  {r.tipo}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Ideia Central</span>
                  <p className="text-foreground font-medium leading-relaxed">{r.ideiaCentral}</p>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Como relacionar à redação</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.comoUsar}</p>
                </div>

                <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 relative group">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest block mb-3">Modelo Adaptável</span>
                  <p className="text-sm font-medium italic text-foreground leading-relaxed whitespace-pre-wrap">
                    "{r.modeloAdaptavel.split(/(\[.*?\])/).map((part, i) => 
                      part.startsWith('[') ? <span key={i} className="text-primary font-black bg-primary/10 px-1 rounded">{part}</span> : part
                    )}"
                  </p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(r.modeloAdaptavel)}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {r.alerta && (
                  <div className="flex items-start gap-2 text-amber-500 text-xs font-bold p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Atenção: {r.alerta}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-64 space-y-4">
              <div className="p-6 rounded-2xl bg-muted/50 border border-border">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-3">Eixos Temáticos</span>
                <div className="flex flex-wrap gap-2">
                  {r.eixosTematicos.map(e => (
                    <span key={e} className="px-2 py-1 rounded-md bg-background border border-border text-[9px] font-black uppercase tracking-tighter text-foreground">
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
          {step === 1 && (
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

          {step === 2 && currentResponse && (
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
                    className="w-full px-6 py-4 rounded-2xl bg-muted/30 border border-border focus:border-primary outline-none transition-all font-bold min-h-[120px] resize-none"
                  />
                  <button 
                    disabled={!detalhes || loading}
                    onClick={() => {
                      console.log("Clique detectado no CONTINUAR ANÁLISE");
                      handleGenerate();
                    }}
                    className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : "CONTINUAR ANÁLISE"}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && currentResponse?.repertorio && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#22c55e]" />
                </div>
                <h3 className="text-2xl font-black">Repertório Finalizado!</h3>
                <p className="text-muted-foreground font-medium italic">"{currentResponse.message}"</p>
              </div>

              <div className="space-y-6">
                <div className="p-8 rounded-[2rem] bg-muted/30 border-2 border-primary/20 relative group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-black text-primary tracking-tight">{currentResponse.repertorio.titulo}</h4>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{currentResponse.repertorio.autor}</p>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`${currentResponse.repertorio!.titulo} - ${currentResponse.repertorio!.autor}\n\n${currentResponse.repertorio!.exemplo}`)}
                      className="p-3 rounded-xl bg-background border border-border text-muted-foreground hover:text-primary transition-all"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest block mb-1">Conceito Chave</span>
                      <p className="text-sm font-bold text-foreground leading-relaxed">{currentResponse.repertorio.ideia}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest block mb-1">Uso Produtivo</span>
                      <p className="text-sm font-bold text-foreground leading-relaxed">{currentResponse.repertorio.relacao}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest block mb-2">Exemplo no Texto</span>
                      <p className="text-sm font-medium italic text-foreground/90 leading-relaxed">"{currentResponse.repertorio.exemplo}"</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={reset}
                    className="flex-1 py-4 rounded-xl bg-muted font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all"
                  >
                    CRIAR OUTRO
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
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
      className="flex flex-col items-center justify-center p-6 rounded-3xl border border-border bg-card hover:border-primary/50 transition-all hover:scale-105 group"
    >
      <div className={`p-4 rounded-2xl ${color}/10 ${color.replace('bg-', 'text-')} mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-8 h-8" />
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      <span className="text-2xl font-black tracking-tight">{value}</span>
    </button>
  );
}
