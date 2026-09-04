import { Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FunnelSignupProps {
  onComplete: () => void;
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered")) {
    return "Este e-mail já possui uma conta. Use a opção Entrar e continuar.";
  }
  if (normalized.includes("password should be at least")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  if (normalized.includes("invalid email") || normalized.includes("unable to validate email")) {
    return "Digite um endereço de e-mail válido.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Muitas tentativas seguidas. Aguarde um instante e tente novamente.";
  }
  return "Não foi possível criar sua conta agora. Confira os dados e tente novamente.";
}

export function FunnelSignup({ onComplete }: FunnelSignupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setConfirmationSent(false);

    if (password !== confirmPassword) {
      setError("As senhas não são iguais. Confira e digite novamente.");
      return;
    }

    setLoading(true);
    localStorage.setItem("funnel_auth_return", "1");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        localStorage.removeItem("funnel_auth_return");
        onComplete();
        return;
      }

      setConfirmationSent(true);
    } catch (caught) {
      localStorage.removeItem("funnel_auth_return");
      setError(translateAuthError(caught instanceof Error ? caught.message : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#24365F]/25 bg-[var(--paper)] p-5 shadow-[0_20px_50px_-28px_rgba(22,33,58,0.45)] md:p-8">
        <div className="mb-6 text-center">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
            Sua redação já está pronta
          </p>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16213A] text-white">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h2 className="font-['Fraunces'] text-2xl font-black italic text-[var(--ink)] md:text-3xl">
            Falta só criar seu acesso
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--ink-2)] md:text-base">
            Assim sua análise fica ligada à sua conta e você continua exatamente de onde parou. Os
            dados da sua redação já estão preservados neste dispositivo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ink-3)]">
              E-mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[#24365F] focus:ring-2 focus:ring-[#24365F]/15"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ink-3)]">
                Crie uma senha
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo de 6 caracteres"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[#24365F] focus:ring-2 focus:ring-[#24365F]/15"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ink-3)]">
                Confirme a senha
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
                placeholder="Digite novamente"
                className={cn(
                  "w-full rounded-xl border bg-[var(--paper-2)] px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:ring-2",
                  confirmPassword.length > 0 && password !== confirmPassword
                    ? "border-[var(--red)] focus:ring-[var(--red)]/15"
                    : "border-[var(--line)] focus:border-[#24365F] focus:ring-[#24365F]/15",
                )}
              />
            </label>
          </div>

          {error && (
            <p className="rounded-xl border border-[var(--red)]/25 bg-[var(--red)]/5 p-3 text-sm font-bold text-[var(--red)]">
              {error}
            </p>
          )}
          {confirmationSent && (
            <p className="rounded-xl border border-[#24365F]/25 bg-[#24365F]/5 p-4 text-sm font-bold leading-relaxed text-[#24365F]">
              Enviamos um link de confirmação para seu e-mail. Abra o link e você voltará para esta
              etapa com sua redação preservada.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || confirmationSent}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#16213A] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_14px_30px_-14px_rgba(22,33,58,0.55)] transition hover:bg-[#24365F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Criando seu acesso..."
              : confirmationSent
                ? "Confira seu e-mail"
                : "Criar conta e continuar"}
            {!loading && !confirmationSent && <ArrowRight className="ml-2 h-4 w-4" />}
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-medium text-[var(--ink-3)]">
          Já possui uma conta?{" "}
          <Link
            to="/auth"
            onClick={() => localStorage.setItem("funnel_auth_return", "1")}
            className="font-black text-[#24365F] underline decoration-[#24365F]/30 underline-offset-4"
          >
            Entrar e continuar
          </Link>
        </p>
      </div>
    </div>
  );
}
