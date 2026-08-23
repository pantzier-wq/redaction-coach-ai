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
  const [view, setView] = useState<"login" | "signup">("login");
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
        
        // If data.user exists but data.session is null, it means confirmation is required
        if (data.user && !data.session) {
          toast.success("Verifique seu e-mail!", {
            description: "Enviamos um link de confirmação para você poder acessar a plataforma.",
            duration: 10000,
          });
          setError("✅ Quase lá! Enviamos um e-mail de confirmação. Você precisa clicar no link que enviamos para ativar sua conta e poder entrar.");
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
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center px-4 font-['Public_Sans']">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-[var(--line)] bg-[var(--paper-2)]/80 backdrop-blur-sm p-8 shadow-[0_20px_40px_-12px_rgba(22,33,58,0.1)]">
        <div className="text-center">
          <h1 className="font-['Fraunces'] text-4xl font-black italic tracking-tighter text-[var(--ink)]">
            CORRIGE<span className="text-[var(--red)]">AI</span>
          </h1>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--ink-3)]">Acesso VIP Estudante</p>
        </div>

        {/* Seletor Cadastrar / Entrar */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setView("signup");
              setError(null);
            }}
            className={cn(
              "rounded-xl py-3 text-sm font-black transition-all uppercase tracking-widest",
              view === "signup"
                ? "bg-[var(--ink)] text-[var(--paper)] shadow-md"
                : "text-[var(--ink-3)] hover:text-[var(--ink)]"
            )}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={() => {
              setView("login");
              setError(null);
            }}
            className={cn(
              "rounded-xl py-3 text-sm font-black transition-all uppercase tracking-widest",
              view === "login"
                ? "bg-[var(--ink)] text-[var(--paper)] shadow-md"
                : "text-[var(--ink-3)] hover:text-[var(--ink)]"
            )}
          >
            Entrar
          </button>
        </div>

        <p className="text-center text-sm text-[var(--ink-2)] font-medium italic">
          {view === "login"
            ? "Entre para acessar sua área exclusiva"
            : "Crie sua conta gratuita agora"}
        </p>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--ink-3)] mb-2">E-mail Estudante</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--red)] transition-all placeholder:text-[var(--ink-3)]/40 shadow-sm"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--ink-3)] mb-2">Sua Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--red)] transition-all placeholder:text-[var(--ink-3)]/40 shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {view === "login" && (
            <div className="text-right">
              <a
                href="https://wa.me/5548996736743?text=Olá! Esqueci minha senha do CorrigeAI e preciso de ajuda para recuperar."
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest text-[var(--ink-3)] hover:text-[var(--red)] transition-colors"
              >
                Esqueci minha senha
              </a>
            </div>
          )}

          {error && (
            <div className={cn(
              "text-xs font-bold p-4 rounded-xl border leading-relaxed shadow-sm",
              error.includes("✅") 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-[var(--red)]/5 border-[var(--red)]/20 text-[var(--red)]"
            )}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-5 font-black text-[var(--paper)] bg-[var(--ink)] text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_-5px_rgba(22,33,58,0.2)]"
          >
            {loading ? "PROCESSANDO..." : view === "login" ? "ENTRAR NO SISTEMA" : "CRIAR CONTA AGORA"}
          </button>
        </form>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.15em] text-[var(--ink-3)]">
          Ambiente Seguro • Criptografia SSL
        </p>
      </div>
    </div>
  );
}
  );
}


