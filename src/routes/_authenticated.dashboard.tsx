import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Correcao } from "@/lib/correct-essay.functions";
import { EssaySubmissionArea } from "@/components/EssaySubmissionArea";
import { Sidebar } from "@/components/Sidebar";
import { 
  History, 
  Star, 
  BookOpen, 
  Zap, 
  CreditCard, 
  Trophy, 
  Sparkles,
  ArrowRight,
  PenTool
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
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
    window.location.href = "/";
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

      <main className="flex-1 md:ml-64 min-h-screen pt-20 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
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
                        setEssays(data || []);
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
                    setEssays(data || []);
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
              <div className="grid gap-4 overflow-x-hidden">
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
                      className="rounded-2xl border border-border bg-card p-4 md:p-6 hover:border-primary/50 transition-all hover:scale-[1.01] cursor-pointer group w-full"
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

          {(activeSection === "repertorios" || activeSection === "conectivos" || activeSection === "upgrade") && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="p-6 rounded-3xl bg-secondary/10 border-2 border-secondary/20 mb-8 inline-block">
                  <Sparkles className="w-16 h-16 text-secondary animate-pulse" />
                </div>
                <h2 className="text-4xl font-black mb-4 tracking-tight">Recurso Exclusivo PRO 🚀</h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {activeSection === "repertorios" && "Tenha acesso ao nosso banco de dados com os melhores repertórios coringa para qualquer tema."}
                  {activeSection === "conectivos" && "Aprenda a conectar suas ideias perfeitamente para garantir 200 pontos na Competência 4."}
                  {activeSection === "upgrade" && "Garanta correções ilimitadas e acesso vitalício a todas as ferramentas do CorrigeAI."}
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
                          <p className="text-[12px] text-white font-bold leading-tight">Modelos universais prontos para qualquer tema do ENEM.</p>
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
                      <li className="flex items-start gap-3 text-sm font-bold text-white">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                          <span className="text-primary font-black">✓</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#22c55e] font-black uppercase text-[11px] tracking-wide">Suporte Prioritário VIP</span>
                          <p className="text-[12px] text-white font-bold leading-tight">Tire dúvidas direto com nossa equipe de especialistas.</p>
                        </div>
                      </li>
                    </ul>

                    <div className="mt-auto">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-bold text-[#22c55e]/60 line-through italic uppercase tracking-widest">Oferta Especial</span>
                        <span className="text-4xl font-black text-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">R$ 42,00</span>
                      </div>
                      <button
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
        </div>
      </main>
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
