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
        supabase.from("essays").select("*").order("created_at", { ascending: false })
      ]);

      setProfile(profRes.data);
      setEssays(essayRes.data || []);
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

      <main className="flex-1 md:ml-64 min-h-screen">
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
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Você tem <span className="text-foreground font-bold">{essays.length}</span> redações no seu histórico. 
                  Pronto para a nota 1000 hoje?
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <StatCard 
                  icon={PenTool} 
                  label="Nova Redação" 
                  value="Começar" 
                  onClick={() => setActiveSection("correcao")}
                  color="bg-primary"
                />
                <StatCard 
                  icon={History} 
                  label="Histórico" 
                  value={essays.length.toString()} 
                  onClick={() => setActiveSection("historico")}
                  color="bg-secondary"
                />
                <StatCard 
                  icon={Sparkles} 
                  label="Status" 
                  value={profile?.is_pro ? "PRO" : "VIP"} 
                  onClick={() => setActiveSection("upgrade")}
                  color="bg-accent"
                />
              </div>

              {!profile?.is_pro && (
                <div className="rounded-3xl border-2 border-secondary/40 bg-secondary/5 p-8 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="p-4 rounded-2xl bg-secondary/20 text-secondary">
                      <Sparkles className="w-12 h-12" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-black mb-2">Desbloqueie o Acesso Vitalício</h3>
                      <p className="text-muted-foreground">Correções ilimitadas e todas as ferramentas PRO por apenas R$ 24,90.</p>
                    </div>
                    <button 
                      onClick={() => setActiveSection("upgrade")}
                      className="px-8 py-4 rounded-xl bg-secondary text-secondary-foreground font-black hover:scale-105 transition-transform"
                    >
                      QUERO SER PRO
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
              <div className="grid gap-4">
                {essays.length > 0 ? (
                  essays.map((essay) => (
                    <div key={essay.id} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:scale-[1.01] cursor-pointer group">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                            {new Date(essay.created_at).getDate()}
                          </div>
                          <div>
                            <h3 className="font-bold line-clamp-1 group-hover:text-primary transition-colors">{essay.tema}</h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(essay.created_at).toLocaleDateString('pt-BR')} • {essay.redacao.length} caracteres
                            </p>
                          </div>
                        </div>
                        <div className="text-3xl font-black text-primary">
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
                
                <div className="bg-card border border-border rounded-3xl p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-bold">Plano Vitalício</span>
                    <div className="text-right">
                      <span className="text-muted-foreground line-through text-sm">R$ 97,00</span>
                      <div className="text-3xl font-black text-secondary">R$ 24,90</div>
                    </div>
                  </div>
                  <button className="w-full py-5 rounded-2xl bg-secondary text-secondary-foreground font-black text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(var(--secondary-rgb),0.3)]">
                    DESBLOQUEAR TUDO AGORA
                  </button>
                  <p className="mt-4 text-xs text-muted-foreground uppercase tracking-widest font-black">
                    <CreditCard className="w-3 h-3 inline mr-1" /> Pagamento único • Acesso para sempre
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-4 rounded-xl border border-border bg-card/50">
                    <h4 className="font-black text-xs text-secondary mb-1">PRODUTO VIP 01</h4>
                    <p className="text-sm font-bold">Guia de Repertórios</p>
                    <p className="text-xl font-black mt-2">R$ 12,90</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card/50">
                    <h4 className="font-black text-xs text-primary mb-1">PRODUTO VIP 02</h4>
                    <p className="text-sm font-bold">Flashcards Conectivos</p>
                    <p className="text-xl font-black mt-2">R$ 12,90</p>
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
