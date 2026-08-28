import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"login" | "forgot" | "reset">("login");
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isRecoveryFlow =
        event === "PASSWORD_RECOVERY" ||
        new URLSearchParams(window.location.search).get("recovery") === "1";
      if (isRecoveryFlow) {
        setPassword("");
        setConfirmPassword("");
        setError(null);
        setView("reset");
        return;
      }

      if (session) {
        // A liberação de plano/créditos acontece exclusivamente pelo webhook de
        // pagamento no servidor. O frontend não tem (e não deve ter) esse poder.
        localStorage.removeItem("should_upgrade_after_auth");
        const shouldReturnToFunnel =
          localStorage.getItem("funnel_auth_return") === "1" &&
          !!localStorage.getItem("quiz_answers");
        navigate({ to: shouldReturnToFunnel ? "/" : "/dashboard" });
      }
    });
    return () => subscription.unsubscribe();
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
    setError(null);

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(traduzirErro(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
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
        redirectTo: `${window.location.origin}/auth?recovery=1`,
      });
      if (error) throw error;
      toast.success("Enviamos um link para recuperação de senha no seu e-mail!");
      setView("login");
      setError(
        "✅ Se existir uma conta com esse e-mail, você receberá um link para criar uma nova senha.",
      );
    } catch (err) {
      setError(traduzirErro(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("As senhas não são iguais. Confira e digite novamente.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      window.history.replaceState({}, "", "/auth");
      toast.success("Senha atualizada com sucesso!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(traduzirErro(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center px-4 font-['Public_Sans']">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-[var(--line)] bg-[var(--paper-2)]/80 backdrop-blur-sm p-8 shadow-[0_20px_40px_-12px_rgba(22,33,58,0.1)]">
        <div className="text-center">
          <h1 className="font-['Fraunces'] text-4xl font-black italic tracking-tighter text-[var(--ink)]">
            CORRIGE<span className="text-[var(--red)]">AI</span>
          </h1>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--ink-3)]">
            Acesso VIP Estudante
          </p>
        </div>

        <p className="text-center text-sm text-[var(--ink-2)] font-medium italic">
          {view === "login"
            ? "Entre para acessar sua área exclusiva"
            : view === "forgot"
              ? "Receba por e-mail o link para criar uma nova senha"
              : "Crie e confirme sua nova senha"}
        </p>

        <form
          onSubmit={
            view === "forgot"
              ? handleResetPassword
              : view === "reset"
                ? handleUpdatePassword
                : handleEmailAuth
          }
          className="space-y-6"
        >
          <div className="space-y-4">
            {view !== "reset" && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  E-mail Estudante
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--red)] transition-all placeholder:text-[var(--ink-3)]/40 shadow-sm"
                  placeholder="seu@email.com"
                />
              </div>
            )}
            {view !== "forgot" && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  Sua Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={view === "login" ? "current-password" : "new-password"}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--red)] transition-all placeholder:text-[var(--ink-3)]/40 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            )}
            {view === "reset" && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  Confirme sua senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error?.startsWith("As senhas não são iguais")) setError(null);
                  }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
                  className={cn(
                    "w-full rounded-xl border bg-[var(--paper)] px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-[var(--ink-3)]/40 shadow-sm",
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? "border-[var(--red)] focus:ring-[var(--red)]"
                      : "border-[var(--line)] focus:ring-[var(--red)]",
                  )}
                  placeholder="Digite a mesma senha novamente"
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-2 text-xs font-bold text-[var(--red)]">
                    As senhas ainda não são iguais.
                  </p>
                )}
              </div>
            )}
          </div>

          {view === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setView("forgot");
                  setPassword("");
                  setConfirmPassword("");
                  setError(null);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--ink-3)] hover:text-[var(--red)] transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {view === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setView("login");
                setError(null);
              }}
              className="w-full text-center text-[10px] font-black uppercase tracking-widest text-[var(--ink-3)] hover:text-[var(--red)] transition-colors"
            >
              Voltar para entrar
            </button>
          )}

          {error && (
            <div
              className={cn(
                "text-xs font-bold p-4 rounded-xl border leading-relaxed shadow-sm",
                error.includes("✅")
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-[var(--red)]/5 border-[var(--red)]/20 text-[var(--red)]",
              )}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-5 font-black text-[var(--paper)] bg-[var(--ink)] text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_-5px_rgba(22,33,58,0.2)]"
          >
            {loading
              ? "PROCESSANDO..."
              : view === "login"
                ? "ENTRAR NO SISTEMA"
                : view === "forgot"
                  ? "ENVIAR LINK POR E-MAIL"
                  : "SALVAR NOVA SENHA"}
          </button>
        </form>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.15em] text-[var(--ink-3)]">
          Ambiente Seguro • Criptografia SSL
        </p>
      </div>
    </div>
  );
}
