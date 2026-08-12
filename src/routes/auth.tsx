import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"login" | "signup" | "forgot">("login");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Sync pending essay if exists
        const pending = localStorage.getItem("pending_essay_correction");
        if (pending) {
          try {
            const data = JSON.parse(pending);
            const { error } = await supabase.from("essays").insert({
              user_id: session.user.id,
              tema: data.tema,
              redacao: data.redacao,
              resultado: data.resultado
            });
            if (!error) {
              localStorage.removeItem("pending_essay_correction");
              toast.success("Sua redação gratuita foi salva na sua conta!");
            }
          } catch (e) {
            console.error("Erro ao sincronizar redação pendente", e);
          }
        }

        // A liberação de plano/créditos acontece exclusivamente pelo webhook de
        // pagamento no servidor. O frontend não tem (e não deve ter) esse poder.
        localStorage.removeItem("should_upgrade_after_auth");



        navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  /**
   * Traduz mensagens de erro do provedor de autenticação para português.
   * Fallback: mensagem genérica, para nunca expor texto técnico em inglês.
   */
  function traduzirErro(mensagem: string): string {
    const m = (mensagem || "").toLowerCase();
    if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
    if (m.includes("user already registered") || m.includes("already been registered"))
      return "Este e-mail já está cadastrado. Faça login.";
    if (m.includes("password should be at least"))
      return "A senha deve ter pelo menos 6 caracteres.";
    if (m.includes("password") && m.includes("weak"))
      return "Senha muito fraca. Use letras, números e no mínimo 6 caracteres.";
    if (m.includes("pwned") || m.includes("compromised"))
      return "Essa senha é muito comum e insegura. Escolha outra.";
    if (m.includes("unable to validate email") || m.includes("invalid email"))
      return "E-mail inválido. Verifique e tente novamente.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "Muitas tentativas. Aguarde alguns instantes e tente de novo.";
    if (m.includes("network") || m.includes("failed to fetch"))
      return "Falha de conexão. Verifique sua internet e tente novamente.";
    if (m.includes("user not found")) return "Não encontramos uma conta com esse e-mail.";
    return "Não foi possível concluir. Tente novamente.";
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.info("Enviamos um e-mail de confirmação. Confirme para entrar.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(traduzirErro(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Por favor, digite seu e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("Enviamos um link para recuperação de senha no seu e-mail!");
      setView("login");
    } catch (err) {
      setError(traduzirErro(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  }




  return (
    <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight">
            CorrigeAI <span className="text-primary">VIP</span>
          </h1>
        </div>

        {/* Seletor Cadastrar / Entrar */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => {
              setView("signup");
              setError(null);
            }}
            className={
              view === "signup"
                ? "rounded-xl py-2.5 text-sm font-black text-primary-foreground transition-all"
                : "rounded-xl py-2.5 text-sm font-bold text-muted-foreground transition-all hover:text-foreground"
            }
            style={view === "signup" ? { background: "var(--gradient-cta)" } : undefined}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={() => {
              setView("login");
              setError(null);
            }}
            className={
              view === "login"
                ? "rounded-xl py-2.5 text-sm font-black text-primary-foreground transition-all"
                : "rounded-xl py-2.5 text-sm font-bold text-muted-foreground transition-all hover:text-foreground"
            }
            style={view === "login" ? { background: "var(--gradient-cta)" } : undefined}
          >
            Entrar
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {view === "forgot"
            ? "Digite seu e-mail para recuperar a senha"
            : view === "login"
              ? "Entre para acessar sua área exclusiva"
              : "Crie sua conta e decole sua nota"}
        </p>

        {view === "forgot" ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
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
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
            <button
              type="button"
              onClick={() => {
                setView("login");
                setError(null);
              }}
              className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar para o login
            </button>
          </form>
        ) : (
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
              minLength={6}
              className="w-full rounded-xl border border-border bg-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>
          {view === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setView("forgot");
                  setError(null);
                }}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}


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
      </div>
    </div>
  );
}

