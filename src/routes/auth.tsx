import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (view === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no login com Google");
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight">
            CorrigeAI <span className="text-primary">VIP</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {view === "login" ? "Entre para acessar sua área exclusiva" : "Crie sua conta e decole sua nota"}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 font-bold text-primary-foreground transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
          >
            {loading ? "Processando..." : view === "login" ? "Entrar" : "Criar Conta"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
          </div>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 font-bold transition-all hover:bg-muted"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Google
        </button>

        <div className="text-center text-sm">
          <button
            onClick={() => setView(view === "login" ? "signup" : "login")}
            className="text-primary hover:underline"
          >
            {view === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
          </button>
        </div>
      </div>
    </div>
  );
}
