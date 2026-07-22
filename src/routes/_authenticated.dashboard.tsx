import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Correcao } from "@/lib/correct-essay.functions";
import { LogOut, BookOpen, Zap, History, Star, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [essays, setEssays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="dark min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black italic tracking-tighter">
              CORRIGE<span className="text-primary">AI</span>
            </span>
            <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              {profile?.is_pro ? "PRO" : "VIP FREE"}
            </span>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Welcome Card */}
            <div className="rounded-3xl border border-border bg-card p-8 relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary-rgb),0.05)]">
              <div className="relative z-10">
                <h1 className="text-3xl font-black mb-2">Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Estudante'}! ✍️</h1>
                <p className="text-muted-foreground">
                  Você tem <strong className="text-foreground">{profile?.credits || 0} créditos</strong> disponíveis para correções ultra-detalhadas.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="/#corrigir" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:scale-105 transition-transform">
                    <Zap className="w-4 h-4 fill-current" />
                    Nova Correção
                  </a>
                  {!profile?.is_pro && (
                    <button className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 font-bold text-secondary-foreground hover:scale-105 transition-transform">
                      Seja PRO Ilimitado
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
            </div>

            {/* Essay History */}
            <div>
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Histórico de Correções
              </h2>
              <div className="space-y-4">
                {essays.length > 0 ? (
                  essays.map((essay) => (
                    <div key={essay.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors group cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold line-clamp-1">{essay.tema}</h3>
                        <span className="text-2xl font-black text-primary">{(essay.resultado as Correcao).nota_total}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(essay.created_at).toLocaleDateString('pt-BR')}</span>
                        <span>{essay.redacao.length} caracteres</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl">
                    <p className="text-muted-foreground">Nenhuma redação corrigida ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Orderbumps */}
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 text-secondary">
              <Star className="w-5 h-5 fill-current" />
              UPGRADE VIP
            </h2>
            
            {/* Orderbump 1 */}
            <div className="rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase">
                OFERTA ÚNICA
              </div>
              <BookOpen className="w-8 h-8 text-secondary mb-3" />
              <h3 className="font-black text-lg mb-1">Guia de Repertórios Coringa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                15 citações e conceitos que cabem em 90% dos temas do ENEM.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-secondary">R$ 19,90</span>
                <button className="rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground hover:opacity-90">
                  Adicionar
                </button>
              </div>
            </div>

            {/* Orderbump 2 */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden group">
               <Zap className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-black text-lg mb-1">Flashcards Conectivos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Domine a competência 4 e garanta os 200 pontos de coesão.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-primary">R$ 27,00</span>
                <button className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                  Adicionar
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-muted">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Pagamento Seguro</h4>
                  <p className="text-[10px] text-muted-foreground">Processado por Stripe</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Acesso imediato após a confirmação.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
