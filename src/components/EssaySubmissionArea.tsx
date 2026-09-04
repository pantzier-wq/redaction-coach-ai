import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  corrigirRedacao,
  transcreverFotoRedacao,
  type Correcao,
} from "@/lib/correct-essay.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  LockKeyhole,
  Camera,
  LoaderCircle,
} from "lucide-react";
import { goToCheckout, goToCreditsCheckout } from "@/lib/checkout";
import { CouponUnlockedBanner } from "@/components/CouponUnlockedBanner";
import { buildLocalPreview } from "@/lib/local-preview";

interface EssaySubmissionAreaProps {
  isLoggedIn: boolean;
  isPro?: boolean;
  onSuccess?: (result: Correcao) => void;
  showEssayForm?: boolean;
  onContinue?: () => void;
  onRequireSignup?: () => void;
  hideTheme?: boolean;
}

function Step({ text, delay, isLast }: { text: string; delay: number; isLast?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
      <span
        className={`text-sm font-medium ${isLast ? "text-[var(--red)] font-bold italic" : "text-[var(--ink-2)]"}`}
      >
        {text}
      </span>
    </div>
  );
}

const LIMITE_ESSENCIAL = 12;
const ANALYSIS_DURATION_MS = 6000;

async function waitForAnalysisWindow(startedAt: number) {
  const remaining = Math.max(0, ANALYSIS_DURATION_MS - (Date.now() - startedAt));
  if (remaining > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, remaining));
  }
}

const PHOTO_MAX_FILE_BYTES = 15 * 1024 * 1024;
const PHOTO_MAX_DATA_URL_LENGTH = 2_700_000;

async function prepareEssayPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("PHOTO_INVALID_FORMAT");
  if (file.size > PHOTO_MAX_FILE_BYTES) throw new Error("PHOTO_TOO_LARGE");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("PHOTO_READ_FAILED"));
      element.src = objectUrl;
    });

    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PHOTO_READ_FAILED");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.88, 0.76, 0.64]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= PHOTO_MAX_DATA_URL_LENGTH) return dataUrl;
    }
    throw new Error("PHOTO_TOO_LARGE");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getPhotoErrorMessage(message: string) {
  return message.includes("PHOTO_NO_TEXT")
    ? "Não encontramos texto nessa foto. Fotografe uma página com a redação inteira."
    : message.includes("PHOTO_NOT_ESSAY")
      ? "A imagem não parece conter uma redação. Envie uma foto com texto contínuo e pelo menos alguns parágrafos."
      : message.includes("PHOTO_UNREADABLE")
        ? "Não conseguimos ler essa foto. Tente novamente com mais luz, foco e a página inteira visível."
        : message.includes("PHOTO_TOO_LARGE")
          ? "A imagem ficou muito grande. Tire outra foto mais próxima da folha."
          : message.includes("PHOTO_INVALID_FORMAT") || message.includes("PHOTO_READ_FAILED")
            ? "Esse arquivo não pôde ser lido. Use uma foto em JPG, PNG ou WebP."
            : "Não foi possível ler a redação agora. Tente outra foto em instantes.";
}

export function EssaySubmissionArea({
  isLoggedIn,
  isPro: propIsPro,
  onSuccess,
  showEssayForm = true,
  onContinue,
  onRequireSignup,
  hideTheme = false,
}: EssaySubmissionAreaProps) {
  const [tema, setTema] = useState("");
  const [redacao, setRedacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showUpsellOffer, setShowUpsellOffer] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [result, setResult] = useState<Correcao | null>(null);
  const [isPro, setIsPro] = useState(propIsPro || false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [credits, setCredits] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(!isLoggedIn);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const essayFormRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [timeUntilExam, setTimeUntilExam] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const corrigir = useServerFn(corrigirRedacao);
  const transcreverFoto = useServerFn(transcreverFotoRedacao);

  useEffect(() => {
    if (!isLoggedIn || typeof window === "undefined") return;
    const pendingPhoto = window.localStorage.getItem("pending_essay_photo");
    if (!pendingPhoto) return;

    window.localStorage.removeItem("pending_essay_photo");
    setPhotoLoading(true);
    setPhotoError(null);
    void transcreverFoto({ data: { imageDataUrl: pendingPhoto } })
      .then((response) => setRedacao(response.text))
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error || "");
        setPhotoError(getPhotoErrorMessage(message));
        if (window.localStorage.getItem("resume_submission_after_auth") === "photo") {
          window.localStorage.removeItem("resume_submission_after_auth");
        }
      })
      .finally(() => setPhotoLoading(false));
  }, [isLoggedIn, transcreverFoto]);

  useEffect(() => {
    if (!showOfferModal) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showOfferModal]);

  useEffect(() => {
    const examDate = new Date("2026-11-08T00:00:00").getTime();
    const updateCountdown = () => {
      const remaining = Math.max(0, examDate - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      setTimeUntilExam({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Carrega plano/créditos do usuário logado
  useEffect(() => {
    if (!isLoggedIn) {
      setProfileLoaded(true);
      return;
    }

    setProfileLoaded(false);
    let active = true;
    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_pro, has_full_access, credits")
          .eq("id", user.id)
          .single();
        if (!active || !profile) return;
        setIsPro(!!profile.is_pro);
        setHasFullAccess(!!profile.has_full_access);
        setCredits(profile.credits ?? 0);
      } finally {
        if (active) setProfileLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  // Efeito para carregar redação do histórico se houver no localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("viewing_essay");
    const pendingData = window.localStorage.getItem("pending_essay_data");
    const returnStage = window.sessionStorage.getItem("checkout_return_stage");
    const pendingSubmission = window.localStorage.getItem("pending_submission");

    if (window.location.pathname === "/" && returnStage && pendingSubmission) {
      try {
        const submission = JSON.parse(pendingSubmission) as { tema?: string; redacao?: string };
        if (!submission.redacao?.trim()) throw new Error("missing_pending_essay");
        const restoredTheme = submission.tema?.trim() || "Tema não informado na pré-análise";
        setTema(submission.tema || "");
        setRedacao(submission.redacao);
        setResult(buildLocalPreview(restoredTheme, submission.redacao));
        setShowPaywall(true);
        setShowOfferModal(true);
        setShowUpsellOffer(returnStage === "upsell");
        window.sessionStorage.removeItem("checkout_return_stage");
      } catch (e) {
        window.sessionStorage.removeItem("checkout_return_stage");
        console.error("Erro ao restaurar oferta do checkout", e);
      }
    } else if (saved) {
      try {
        const essay = JSON.parse(saved);
        setTema(essay.tema);
        setRedacao(essay.redacao);
        setResult(essay.resultado);
        window.localStorage.removeItem("viewing_essay");
      } catch (e) {
        console.error("Erro ao carregar redação salva", e);
      }
    } else if (pendingData) {
      try {
        const data = JSON.parse(pendingData);
        setTema(data.tema);
        setRedacao(data.redacao);
        window.localStorage.removeItem("pending_essay_data");
      } catch (e) {
        console.error("Erro ao carregar dados pendentes", e);
      }
    }
  }, [isLoggedIn]);

  const charCount = redacao.trim().length;
  // Ambos os planos consomem créditos; o Combo mantém acesso às ferramentas extras.
  const canCorrect = (hasFullAccess || isPro) && credits > 0;
  const semCreditos = (hasFullAccess || isPro) && credits <= 0;

  // Retoma exatamente o envio interrompido pelo cadastro, já com plano e créditos carregados.
  useEffect(() => {
    if (
      !isLoggedIn ||
      !profileLoaded ||
      photoLoading ||
      redacao.trim().length < 200 ||
      typeof window === "undefined"
    ) {
      return;
    }

    const resumeMode = window.localStorage.getItem("resume_submission_after_auth");
    if (!resumeMode) return;

    const timer = window.setTimeout(() => {
      const form = essayFormRef.current;
      if (!form) return;
      window.localStorage.removeItem("resume_submission_after_auth");
      form.requestSubmit();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isLoggedIn, photoLoading, profileLoaded, redacao]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const analysisStartedAt = Date.now();
    const effectiveTheme = hideTheme
      ? "Tema não informado; considere o assunto desenvolvido na redação"
      : tema.trim();

    setErro(null);
    setResult(null);
    setShowPaywall(false);
    setShowOfferModal(false);
    setShowUpsellOffer(false);

    // Mantém o texto preenchido ao atravessar cadastro, login ou checkout.
    localStorage.setItem("pending_submission", JSON.stringify({ tema: effectiveTheme, redacao }));

    if (!isLoggedIn && onRequireSignup) {
      localStorage.setItem(
        "pending_essay_data",
        JSON.stringify({ tema: effectiveTheme, redacao: redacao.trim() }),
      );
      localStorage.setItem("resume_submission_after_auth", "text");
      onRequireSignup();
      return;
    }

    // A pre-analise publica e para contas sem saldo e 100% local: sem custo e sem armazenar a redacao.
    if (!isLoggedIn || !canCorrect) {
      setLoading(true);
      try {
        const correctionData = buildLocalPreview(effectiveTheme, redacao.trim());
        await waitForAnalysisWindow(analysisStartedAt);
        setResult(correctionData);
        setShowPaywall(true);
      } catch (err) {
        console.error("Erro no fluxo anônimo:", err);
        await waitForAnalysisWindow(analysisStartedAt);
        setErro("Não foi possível concluir a análise. Tente novamente.");
      } finally {
        setLoading(false);
      }

      setTimeout(
        () => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
      return;
    }

    setLoading(true);

    try {
      const submissionKey = `${effectiveTheme}\n${redacao.trim()}`;
      const savedRequest = JSON.parse(localStorage.getItem("pending_ai_request") || "null") as {
        key?: string;
        id?: string;
      } | null;
      const requestId =
        savedRequest?.key === submissionKey && savedRequest.id
          ? savedRequest.id
          : crypto.randomUUID();
      localStorage.setItem(
        "pending_ai_request",
        JSON.stringify({ key: submissionKey, id: requestId }),
      );

      const r = await corrigir({
        data: {
          tema: effectiveTheme,
          redacao: redacao.trim(),
          requestId,
        },
      });

      await waitForAnalysisWindow(analysisStartedAt);

      const correctionData = r.correcao;
      setResult(correctionData);
      setCredits(r.remainingCredits);
      localStorage.removeItem("pending_ai_request");

      // Rola para o resultado após o delay de carregamento
      setTimeout(() => {
        document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Sincroniza saldo e status após a correção
      if (isLoggedIn) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_pro, has_full_access, credits")
            .eq("id", user.id)
            .single();

          if (profile) {
            const pro = !!profile.is_pro;
            const full = !!profile.has_full_access;
            const saldo = profile.credits ?? 0;
            setIsPro(pro);
            setHasFullAccess(full);
            setCredits(saldo);
          }
        }
      }

      // A correcao que consumiu o ultimo credito continua desbloqueada. O saldo
      // zero bloqueia apenas a proxima submissao e apresenta as opcoes de recarga.
      setShowPaywall(false);
      setShowOfferModal(false);
      setShowUpsellOffer(false);

      if (onSuccess) {
        onSuccess(correctionData);
      }
    } catch (err: unknown) {
      console.error("Erro na submissão:", err);
      await waitForAnalysisWindow(analysisStartedAt);

      const errMsg = err instanceof Error ? err.message : String(err || "");
      console.error("DEBUG UI ERROR:", errMsg);
      const semAcesso = errMsg.includes("INSUFFICIENT_CREDITS");
      // Usuário logado sem plano/créditos deve ver as ofertas, nunca um erro genérico.
      if (semAcesso || (isLoggedIn && !canCorrect)) {
        setShowPaywall(true);
        setShowOfferModal(false);
        setShowUpsellOffer(false);
        setErro(null);
      } else {
        if (!errMsg.includes("REQUEST_IN_PROGRESS")) localStorage.removeItem("pending_ai_request");
        const message = errMsg.includes("REQUEST_IN_PROGRESS")
          ? "Sua correção já está sendo processada. Aguarde alguns segundos."
          : "A IA está temporariamente indisponível. Seu crédito foi preservado; tente novamente em instantes.";
        setErro(message);
      }
    } finally {
      setLoading(false);
    }
  }

  // type: 'basic' = Plano Essencial (+12 correções) | 'combo' = +25 correções e ferramentas extras
  async function handleTestPurchase(type: "basic" | "combo" = "basic") {
    // Redireciona para o checkout real (Cakto). A liberação acontece após o pagamento.
    if (window.location.pathname === "/") {
      sessionStorage.setItem("checkout_return_stage", showUpsellOffer ? "upsell" : "basic");
    }
    await goToCheckout(type === "combo" ? "combo" : "essencial");
  }

  // Compra de créditos avulsos (somente para quem já tem o Plano Essencial)
  async function handleBuyCredits(qtd: number) {
    // Redireciona para o checkout real da recarga (Cakto).
    await goToCreditsCheckout(qtd);
  }

  async function handleEssayPhoto(file?: File) {
    if (!file) return;
    if (redacao.trim() && !window.confirm("Substituir o texto atual pela redação da foto?")) {
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    setPhotoLoading(true);
    setPhotoError(null);
    setErro(null);
    try {
      const imageDataUrl = await prepareEssayPhoto(file);
      if (!isLoggedIn && onRequireSignup) {
        window.localStorage.setItem("pending_essay_photo", imageDataUrl);
        window.localStorage.setItem("resume_submission_after_auth", "photo");
        onRequireSignup();
        return;
      }
      const response = await transcreverFoto({ data: { imageDataUrl } });
      setRedacao(response.text);
      window.setTimeout(() => {
        document.getElementById("essay-textarea")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || "");
      setPhotoError(getPhotoErrorMessage(message));
      if (window.localStorage.getItem("resume_submission_after_auth") === "photo") {
        window.localStorage.removeItem("resume_submission_after_auth");
      }
    } finally {
      setPhotoLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  return (
    <div className="w-full space-y-8">
      {result && !loading && (
        <>
          <Resultado data={result} isLoggedIn={isLoggedIn} showPaywall={showPaywall} />

          {showPaywall && (
            <div className="corrige-soft-enter rounded-3xl border-2 border-[var(--red)] bg-[var(--paper-2)] p-5 text-center shadow-sm md:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--red)] md:text-xs">
                O tempo até o ENEM continua correndo
              </p>
              <h3 className="mx-auto mt-3 max-w-2xl font-['Fraunces'] text-2xl font-black leading-tight text-[var(--ink)] md:text-3xl">
                Cada treino sem saber o que corrigir pode manter sua nota no mesmo lugar.
              </h3>
              <div
                className="mx-auto my-6 grid max-w-2xl grid-cols-2 gap-2 font-['Fraunces'] text-[var(--ink)] sm:grid-cols-4"
                aria-label="Contagem regressiva para o ENEM"
              >
                {Object.entries(timeUntilExam).map(([unit, value]) => (
                  <div
                    key={unit}
                    className="rounded-2xl border-2 border-[var(--line)] bg-[var(--paper)] px-2 py-4 shadow-sm"
                  >
                    <div className="text-3xl font-black tabular-nums md:text-4xl">
                      {String(value).padStart(2, "0")}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                      {unit === "days"
                        ? "dias"
                        : unit === "hours"
                          ? "horas"
                          : unit === "minutes"
                            ? "min"
                            : "seg"}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mx-auto mb-6 max-w-xl text-sm font-semibold leading-relaxed text-[var(--ink-2)] md:text-base">
                Você já fez a parte mais difícil: escreveu e enviou sua redação. Agora falta
                descobrir onde concentrar seus estudos para não chegar à prova repetindo erros
                invisíveis.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowOfferModal(true);
                  setShowUpsellOffer(false);
                }}
                className="group inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#16213A] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_14px_30px_-14px_rgba(22,33,58,0.5)] transition-all hover:scale-[1.01] hover:bg-[#24365F] active:scale-95 md:w-auto md:px-10"
              >
                DESBLOQUEAR MINHA CORREÇÃO AGORA
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-3)]">
                Acesso liberado logo após o pagamento
              </p>
            </div>
          )}
        </>
      )}

      <div className="w-full">
        {loading ? (
          <div
            className="corrige-soft-enter rounded-3xl border border-[var(--red)] bg-[var(--paper)] px-5 py-8 text-center md:p-10"
            style={{ boxShadow: "var(--paper-shadow)" }}
          >
            <div className="mb-6 flex justify-center">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 animate-ping rounded-full bg-[var(--red)]/20" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[var(--paper)] border-2 border-[var(--red)] shadow-[0_0_20px_rgba(196,50,42,0.3)]">
                  <span className="text-3xl animate-bounce">✍️</span>
                </div>
              </div>
            </div>

            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--red)]">
              Correção em andamento
            </p>
            <h3 className="mb-3 text-2xl font-['Fraunces'] font-black text-[var(--ink)] md:text-3xl">
              Estamos examinando cada competência
            </h3>
            {(hideTheme || !isLoggedIn) && (
              <p className="mx-auto mb-6 max-w-md text-sm font-medium leading-relaxed text-[var(--ink-2)]">
                Sua análise leva alguns segundos porque a redação é verificada pelos cinco critérios
                usados no ENEM.
              </p>
            )}

            <div className="mx-auto mb-6 h-3 w-full max-w-md overflow-hidden rounded-full bg-[var(--paper-2)] border border-[var(--line)]">
              <div
                className="h-full bg-[var(--red)] shadow-[0_0_15px_rgba(196,50,42,0.4)] transition-all duration-1000 ease-linear"
                style={{
                  width: "100%",
                  animation: "loading-bar 6s linear forwards",
                }}
              />
            </div>

            {(hideTheme || !isLoggedIn) && (
              <div className="relative min-h-[18rem] w-full max-w-md mx-auto overflow-hidden text-left border border-[var(--line)] p-5 rounded-2xl bg-[var(--paper-2)]/50">
                <div className="space-y-3">
                  <Step
                    text={`✓ Lendo sua redação — ${redacao.split(/\s+/).filter(Boolean).length} palavras`}
                    delay={0.4}
                  />
                  <Step text="✓ Competência 1 · domínio da escrita formal" delay={1.1} />
                  <Step text="✓ Competência 2 · compreensão do tema" delay={1.8} />
                  <Step text="✓ Competência 3 · organização dos argumentos" delay={2.5} />
                  <Step text="✓ Competência 4 · coesão e conectivos" delay={3.2} />
                  <Step text="✓ Competência 5 · proposta de intervenção" delay={3.9} />
                  <Step text="✓ Cruzando os pontos que podem reduzir sua nota" delay={4.6} />
                  <Step text="Finalizando sua análise personalizada…" delay={5.3} isLast />
                </div>
              </div>
            )}

            <p className="mt-6 text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-[0.18em] animate-pulse">
              Aguarde nesta página. Seu resultado está quase pronto.
            </p>

            <style>{`
              @keyframes loading-bar {
                0% { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        ) : (
          <div id="corrigir" className="relative w-full space-y-8">
            {(hideTheme || !isLoggedIn) && !result && (
              <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm font-bold leading-relaxed text-[var(--ink-2)] md:mb-8">
                Seu ponto de partida está pronto. Agora precisamos do seu texto para revelar o que
                acontece nas cinco competências do ENEM.
              </div>
            )}
            {!result && !showEssayForm && (
              <div className="rounded-3xl border border-[var(--red)] bg-[var(--paper-2)] p-5 text-center shadow-sm md:p-8">
                <p className="mx-auto mb-6 max-w-md text-base font-medium leading-relaxed text-[var(--ink-2)] md:text-lg">
                  Sua análise inicial está pronta. Continue para colar sua redação e descobrir sua
                  nota real.
                </p>
                <button
                  type="button"
                  onClick={onContinue}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#16213A] px-6 py-4 text-sm font-black tracking-[0.08em] text-white shadow-[0_14px_30px_-14px_rgba(22,33,58,0.5)] transition-all hover:scale-[1.01] hover:bg-[#24365F] md:min-h-0 md:w-auto md:px-8"
                >
                  CONTINUAR PARA A REDAÇÃO
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            )}
            {!result && showEssayForm && (
              <>
                {!isLoggedIn && (
                  <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper-2)] p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 md:p-6">
                    <div className="space-y-4 text-base font-medium leading-relaxed text-[var(--ink-2)] md:text-[1.05rem]">
                      <p>É hora de parar de chutar e começar a agir com estratégia.</p>
                      <p className="border-l-4 border-[var(--red)] bg-[var(--red)]/5 px-4 py-3 font-bold italic text-[var(--ink)]">
                        "Cole sua redação abaixo para descobrir exatamente onde você está perdendo
                        ponto."
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            <form
              ref={essayFormRef}
              onSubmit={onSubmit}
              className={`rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8 transition-all duration-500 overflow-hidden ${!showEssayForm || result ? "hidden" : ""} ${showOfferModal ? "blur-2xl opacity-20 pointer-events-none scale-95" : ""}`}
              style={{ boxShadow: "var(--paper-shadow)" }}
            >
              {isLoggedIn && !hideTheme && (
                <>
                  <label className="mb-2 block text-sm font-bold text-[var(--red)] uppercase tracking-widest">
                    Tema da redação
                  </label>
                  <input
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    required
                    maxLength={300}
                    placeholder="Ex: Desafios para a valorização da comunidade indígena no Brasil"
                    className="w-full rounded-xl border border-[var(--line)] bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-[var(--red)] focus:outline-none"
                  />
                </>
              )}

              <label
                className={`${isLoggedIn && !hideTheme ? "mt-5" : ""} mb-2 block text-sm font-bold text-[var(--red)] uppercase tracking-widest`}
              >
                Cole sua redação aqui
              </label>
              {hideTheme && (
                <div className="mb-4 rounded-2xl border border-[#24365F]/15 bg-[#EEF2F8] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-[var(--ink)]">
                        Sua redação está no caderno?
                      </p>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--ink-2)]">
                        Fotografe a página e nós colocamos o texto aqui para você revisar.
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-3)]">
                        A imagem não é salva no histórico
                      </p>
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={(event) => void handleEssayPhoto(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      disabled={photoLoading}
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#24365F] px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-all hover:bg-[#16213A] disabled:cursor-wait disabled:opacity-70"
                    >
                      {photoLoading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {photoLoading ? "Lendo a foto..." : "Fotografar redação"}
                    </button>
                  </div>
                  {photoError && (
                    <p className="mt-3 rounded-xl border border-[var(--red)]/20 bg-[var(--red-soft)] px-3 py-2 text-xs font-bold leading-relaxed text-[var(--red)]">
                      {photoError}
                    </p>
                  )}
                </div>
              )}
              <textarea
                id="essay-textarea"
                value={redacao}
                onChange={(e) => setRedacao(e.target.value)}
                required
                rows={12}
                maxLength={8000}
                placeholder="Cole o texto completo da sua redação..."
                className="w-full resize-y rounded-xl border border-[var(--line)] bg-input px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--red)] focus:outline-none"
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {charCount} caracteres {charCount < 200 && "• mínimo 200"}
              </div>

              {erro && (
                <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive-foreground animate-in slide-in-from-top-2 duration-300">
                  <p className="font-bold mb-1">Ops! Algo deu errado:</p>
                  <p className="opacity-90">{erro}</p>
                  <button
                    type="button"
                    onClick={() => setErro(null)}
                    className="mt-2 text-[10px] uppercase tracking-wider font-black hover:underline"
                  >
                    Fechar aviso
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    photoLoading ||
                    charCount < 200 ||
                    (!hideTheme && tema.trim().length < 3) ||
                    (!isLoggedIn && showPaywall)
                  }
                  className="flex-1 rounded-xl py-4 text-lg font-black text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  style={{
                    background: "linear-gradient(135deg, #16213A 0%, #24365F 100%)",
                    boxShadow: "0 12px 24px -12px rgba(22, 33, 58, 0.45)",
                  }}
                >
                  CORRIGIR AGORA →
                </button>

                {!isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      setTema("Desafios para a formação educacional de surdos no Brasil");
                      setRedacao(`A Constituição Federal de 1988, norma de maior hierarquia no sistema jurídico brasileiro, garante a todos os cidadãos, sem distinção, o direito à educação de qualidade. Entretanto, a realidade vivenciada por indivíduos surdos no Brasil distancia-se desse ideal democrático. Nesse contexto, é fundamental analisar como a negligência governamental e o preconceito social corroboram a exclusão dessa parcela da população do ambiente acadêmico.

Em primeira análise, a falta de infraestrutura e de profissionais capacitados nas instituições de ensino atua como um entrave à inclusão. Segundo o filósofo John Rawls, em sua teoria da justiça, uma sociedade é justa quando garante as mesmas oportunidades para todos. Contudo, o sistema educacional brasileiro falha ao não disponibilizar intérpretes de Libras em quantidade suficiente e ao não adaptar materiais pedagógicos para a necessidade dos surdos. Dessa forma, o acesso ao conhecimento é restrito, perpetuando um ciclo de desigualdade que impede o pleno desenvolvimento desses cidadãos.

Além disso, o estigma social direcionado às pessoas com deficiência auditiva agrava a problemática. Para o sociólogo Erving Goffman, o estigma é um atributo que torna o indivíduo diferente e menos desejável, resultando em sua marginalização. Muitas vezes, a surdez é vista sob uma ótica de incapacidade, o que gera comportamentos discriminatórios tanto por parte de colegas quanto de professores. Essa barreira simbólica não apenas desestimula o estudante surdo a prosseguir com seus estudos, mas também o isola socialmente, comprometendo sua saúde mental e sua integração na coletividade.

Portanto, medidas são necessárias para reverter esse cenário de exclusão. Cabe ao Ministério da Educação ampliar o investimento na formação de professores bilíngues e na contratação de intérpretes para todas as escolas da rede pública. Paralelamente, é dever do Governo Federal promover campanhas de conscientização nas mídias de grande alcance, com o intuito de desconstruir preconceitos e valorizar a cultura surda. Somente assim, o Brasil poderá assegurar a todos os seus cidadãos o direito constitucional à educação, construindo uma sociedade verdadeiramente inclusiva.`);
                    }}
                    className="px-6 rounded-xl border border-[var(--line)] bg-[var(--paper-2)] text-[var(--ink-2)] font-bold text-sm hover:bg-[var(--line)]/10 transition-colors"
                  >
                    Usar um exemplo
                  </button>
                )}
              </div>

              {!isLoggedIn && (
                <p className="mt-3 text-center text-xs font-bold text-muted-foreground">
                  100% privado
                </p>
              )}
            </form>

            {typeof document !== "undefined" &&
              showOfferModal &&
              ((result && showPaywall) ||
                (isLoggedIn && !canCorrect && showPaywall) ||
                (!isLoggedIn && showPaywall)) &&
              createPortal(
                <div
                  id="paywall-anchor"
                  className="fixed inset-0 z-[100] h-[100dvh] overflow-y-auto overscroll-contain bg-[var(--paper)]/80 p-4 font-['Public_Sans'] backdrop-blur-sm md:p-10"
                  style={{
                    paddingTop: "max(1rem, env(safe-area-inset-top))",
                    paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                  }}
                >
                  <div className="mx-auto flex min-h-full w-full max-w-4xl items-start justify-center">
                    <div className="corrige-soft-enter relative w-full max-w-lg rounded-3xl border border-[var(--red)]/30 bg-[var(--paper)] p-6 shadow-[var(--paper-shadow)] backdrop-blur-2xl md:max-w-4xl md:p-10">
                      <p className="text-sm md:text-base text-[var(--ink-2)] font-semibold mb-6 md:mb-8 leading-relaxed text-center">
                        {!isLoggedIn
                          ? "Desbloqueie sua estimativa de nota e a correção detalhada baseada nas cinco competências avaliadas no ENEM."
                          : semCreditos
                            ? "Seus créditos de correção acabaram. Recarregue ou escolha o Combo Nota 1000 para receber +25 correções e as ferramentas extras de estudo."
                            : result || showPaywall
                              ? "Sua estimativa de nota e a correção detalhada já foram geradas com base na matriz do ENEM."
                              : "Você está a um passo de desbloquear seu potencial máximo e conquistar sua vaga no curso dos sonhos."}
                      </p>

                      {semCreditos && (
                        <div className="mb-8">
                          <p className="text-[11px] font-black uppercase tracking-widest text-[var(--ink-3)] mb-3 text-center">
                            Recarregue seus créditos
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { qtd: 5, preco: "R$ 7,90" },
                              { qtd: 10, preco: "R$ 9,90" },
                              { qtd: 20, preco: "R$ 14,90" },
                            ].map((pack) => (
                              <button
                                key={pack.qtd}
                                onClick={() => handleBuyCredits(pack.qtd)}
                                className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-4 text-center hover:border-[var(--red)] hover:bg-[var(--paper-2)]/80 transition-all shadow-sm"
                              >
                                <div className="text-lg font-black text-[var(--ink)]">
                                  {pack.qtd} correções
                                </div>
                                <div className="text-sm font-black text-[var(--red)]">
                                  {pack.preco}
                                </div>
                                <div className="mt-2 rounded-lg bg-[var(--red)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--red)]">
                                  Obtenha clicando aqui
                                </div>
                              </button>
                            ))}
                          </div>
                          <p className="mt-3 text-center text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-widest">
                            Créditos disponíveis apenas para quem tem o Plano Essencial
                          </p>
                        </div>
                      )}

                      {!semCreditos && (
                        <div className="space-y-6">
                          <div className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--line)] bg-[var(--paper-2)]/60 p-6 shadow-sm md:p-8">
                            <div className="mb-6 flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--paper)] text-[var(--red)] shadow-sm">
                                <Zap className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-[var(--ink)]">
                                  Plano Essencial
                                </h3>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ink-3)]">
                                  acesso vitalício • +12 correções
                                </p>
                              </div>
                            </div>

                            <ul className="mb-8 space-y-3">
                              {[
                                "+12 correções de redação com análise por competência.",
                                "Nota total e leitura estratégica do que está derrubando sua média.",
                                "Histórico para acompanhar a sua evolução ao longo dos treinos.",
                                "Feedback no padrão da redação do ENEM.",
                              ].map((item) => (
                                <li
                                  key={item}
                                  className="flex items-start gap-3 text-sm font-medium text-[var(--ink-2)]"
                                >
                                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--red)] text-[10px] font-black text-white">
                                    ✓
                                  </span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="border-t border-[var(--line)] pt-6">
                              <div className="mb-4 flex items-baseline gap-2">
                                <span className="text-sm font-bold italic text-[var(--ink-3)] line-through">
                                  R$ 29,90
                                </span>
                                <span className="text-4xl font-black text-[var(--ink)]">
                                  R$ 19,90
                                </span>
                              </div>
                              <button
                                onClick={() => setShowUpsellOffer(true)}
                                className="w-full rounded-2xl bg-[var(--ink)] py-4 text-xs font-black uppercase tracking-[0.2em] text-[var(--paper)] transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                              >
                                CONTINUAR COM ESSE PLANO
                              </button>
                              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-3)]">
                                pagamento único • acesso imediato
                              </p>
                            </div>
                          </div>

                          {showUpsellOffer && (
                            <div className="fixed inset-0 z-[110] flex h-[100dvh] items-start justify-center overflow-y-auto overscroll-contain bg-[var(--ink)]/45 p-2 backdrop-blur-sm sm:items-center sm:p-4">
                              <div className="corrige-soft-enter w-full max-w-2xl rounded-[1.5rem] border-2 border-[#24365F] bg-[var(--paper)] p-3 shadow-[0_28px_80px_-24px_rgba(22,33,58,0.5)] sm:rounded-[2rem] sm:p-6 md:p-8">
                                <div className="mb-3 text-center sm:mb-6">
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#24365F] sm:text-[11px] sm:tracking-[0.2em]">
                                    oferta mais vantajosa
                                  </p>
                                  <h3 className="mt-1 font-['Fraunces'] text-xl font-black italic leading-tight text-[var(--ink)] sm:mt-2 sm:text-3xl">
                                    Antes de fechar o básico, veja o plano que mais compensa
                                  </h3>
                                  <p className="mt-3 hidden text-sm font-medium leading-relaxed text-[var(--ink-2)] sm:block">
                                    Para intensificar os treinos até o ENEM, o Combo Nota 1000
                                    entrega mais que o dobro de correções do plano anterior e
                                    ferramentas extras para evoluir sua escrita.
                                  </p>
                                </div>

                                <div className="rounded-[1.25rem] border border-[#24365F]/25 bg-[#EEF2F8] p-3 sm:rounded-[1.75rem] sm:p-6">
                                  <div className="mb-3 flex items-center gap-3 sm:mb-5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#24365F] text-white shadow-[0_0_18px_rgba(36,54,95,0.3)] sm:h-12 sm:w-12 sm:rounded-2xl">
                                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div>
                                      <h4 className="text-lg font-black uppercase leading-tight tracking-tight text-[var(--ink)] sm:text-xl">
                                        Combo Nota 1000
                                      </h4>
                                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#24365F] sm:text-[11px] sm:tracking-[0.18em]">
                                        o que mais vale a pena
                                      </p>
                                    </div>
                                  </div>

                                  <ul className="mb-3 space-y-1.5 sm:mb-6 sm:space-y-3">
                                    {[
                                      "+25 correções para ampliar sua rotina de treinos.",
                                      "IA de repertório sociocultural para fortalecer argumentação.",
                                      "Laboratório de conectivos.",
                                      "Biblioteca com repertórios coringas para vários temas.",
                                      "Plano ideal para quem quer insistir até subir a nota de verdade.",
                                    ].map((item) => (
                                      <li
                                        key={item}
                                        className="flex items-start gap-2 text-xs font-medium leading-tight text-[var(--ink-2)] sm:gap-3 sm:text-sm sm:leading-normal"
                                      >
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#24365F] text-[8px] font-black text-white sm:mt-0.5 sm:h-5 sm:w-5 sm:text-[10px]">
                                          ✓
                                        </span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>

                                  <div className="mb-3 flex items-end justify-center gap-3 sm:mb-5 sm:justify-start">
                                    <span className="whitespace-nowrap pb-1 text-xs font-bold italic text-[var(--ink-3)] line-through sm:text-sm">
                                      R$ 59,00
                                    </span>
                                    <span className="whitespace-nowrap text-3xl font-black leading-none text-[var(--ink)] sm:text-4xl">
                                      R$ 39,00
                                    </span>
                                  </div>

                                  <div className="space-y-1.5 sm:space-y-3">
                                    <button
                                      onClick={() => handleTestPurchase("combo")}
                                      className="w-full rounded-xl bg-[#16213A] px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-all hover:scale-[1.02] hover:bg-[#24365F] active:scale-95 shadow-[0_12px_28px_-10px_rgba(22,33,58,0.5)] sm:rounded-2xl sm:py-4 sm:text-sm sm:tracking-[0.16em]"
                                    >
                                      QUERO O PLANO QUE MAIS COMPENSA
                                    </button>
                                    <button
                                      onClick={() => handleTestPurchase("basic")}
                                      className="w-full rounded-xl border border-[#24365F]/25 bg-[var(--paper)] px-3 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-[var(--ink)] transition-colors hover:border-[#24365F] hover:text-[#24365F] sm:rounded-2xl sm:py-4 sm:text-sm sm:tracking-[0.14em]"
                                    >
                                      quero adquirir o anterior
                                    </button>
                                    <button
                                      onClick={() => setShowUpsellOffer(false)}
                                      className="w-full py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink-3)] transition-colors hover:text-[var(--ink)] sm:py-2 sm:text-[11px] sm:tracking-[0.18em]"
                                    >
                                      voltar para a oferta anterior
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-2 text-center pt-2">
                            <p className="rounded-lg border border-[var(--line)] bg-[var(--paper-2)] py-2 text-xs font-black uppercase tracking-widest text-[var(--ink)] shadow-sm">
                              acesso liberado logo após o pagamento
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>,
                document.body,
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function Resultado({
  data,
  isLoggedIn,
  showPaywall,
}: {
  data: Correcao;
  isLoggedIn: boolean;
  showPaywall?: boolean;
}) {
  const quizAnswers =
    !isLoggedIn && typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("quiz_answers") || "{}")
      : {};
  const chuta = quizAnswers.score_guess || "800 a 900";
  const notaTotal = data.nota_total;
  const diff = Math.abs(notaTotal - parseInt(chuta.split(" ")[0]) || 0);

  return (
    <div
      id="resultado"
      className="corrige-soft-enter mt-10 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8 overflow-hidden relative"
      style={{ boxShadow: "var(--paper-shadow)" }}
    >
      <div className="text-center mb-10">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--ink-3)] mb-2">
          Resultado da Análise
        </div>
        {!isLoggedIn && (
          <p className="text-sm font-medium text-[var(--ink-2)] mb-4">
            Você estimou {chuta}. Sua análise calculou:
          </p>
        )}
        <div className="relative mx-auto inline-flex">
          <div
            className={`text-7xl md:text-8xl font-black text-[var(--red)] font-['Fraunces'] leading-none transition-all ${showPaywall ? "select-none blur-sm" : ""}`}
          >
            {data.nota_total}
            <span className="text-xl text-[var(--ink-3)] ml-2 tracking-tighter">/1000</span>
          </div>
          {showPaywall && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border border-[var(--red)]/20 bg-[var(--paper)]/95 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--red)] shadow-sm">
                Nota calculada e bloqueada
              </span>
            </div>
          )}
        </div>
        {(showPaywall || !isLoggedIn) && (
          <p className="mt-6 text-sm font-bold text-[var(--ink)] max-w-md mx-auto leading-relaxed">
            {showPaywall
              ? "Sua redação já foi examinada nas cinco competências. Agora você precisa ver o que a banca enxergaria antes de repetir os mesmos padrões no próximo treino."
              : `São ${diff} pontos de diferença entre o que você achava e o que a banca veria.`}
          </p>
        )}
      </div>

      {showPaywall && (
        <div className="mb-8 rounded-2xl border border-[var(--red)]/25 bg-[var(--red)]/5 p-5 md:p-6">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--red)]">
            Atenção antes do próximo treino
          </p>
          <h3 className="font-['Fraunces'] text-xl font-black leading-tight text-[var(--ink)] md:text-2xl">
            Escrever mais sem saber onde você perde pontos pode apenas reforçar os mesmos erros.
          </h3>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[var(--ink-2)]">
            A banca avalia critérios específicos, não apenas se o texto “parece bom”. Desbloqueie o
            análise para entender suas cinco competências, priorizar o que corrigir e estudar com
            direção até o ENEM.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {data.competencias.map((c, idx) => {
          const isLockedPreview = showPaywall === true && idx > 0;
          const isPartialPreview = showPaywall === true && idx === 0;
          const analiseTexto = isLockedPreview
            ? getLockedCompetencyTeaser(c.numero)
            : isPartialPreview
              ? "A análise da Competência 1 identificou pontos que merecem atenção na escrita formal. O detalhamento mostra como esse critério impacta sua nota e o que priorizar nos próximos treinos."
              : c.analise;

          return (
            <div
              key={c.numero}
              className={`relative flex min-h-[13rem] flex-col overflow-hidden rounded-2xl border-2 p-5 transition-all duration-500 ${isLockedPreview ? "border-[var(--red)]/30 bg-[var(--paper-2)] shadow-[0_12px_30px_-22px_rgba(196,50,42,0.55)]" : "border-[var(--red)]/45 bg-[var(--paper-2)] shadow-sm"}`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 font-bold text-[var(--ink)] text-xs md:text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--red)] text-[10px] font-black text-white">
                    {isLockedPreview ? <LockKeyhole className="h-3.5 w-3.5" /> : "✓"}
                  </span>
                  C{c.numero}
                </div>
                <div
                  className={`text-lg font-black text-[var(--red)] font-['Fraunces'] ${isLockedPreview ? "select-none blur-[5px]" : ""}`}
                >
                  {c.nota}
                  <span className="text-[10px] text-[var(--ink-3)] ml-1">/200</span>
                </div>
              </div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--ink)]">
                {c.titulo}
              </p>
              <p
                className={`text-sm font-medium leading-relaxed text-[var(--ink-2)] ${showPaywall ? "line-clamp-4" : ""} ${isLockedPreview ? "select-none blur-[4px]" : ""}`}
              >
                {analiseTexto}
              </p>
              {!showPaywall && (
                <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--red)]">
                      Evidência no seu texto
                    </p>
                    <blockquote className="mt-1 border-l-2 border-[var(--red)] pl-3 text-xs font-bold italic leading-relaxed text-[var(--ink)]">
                      “{c.evidencia || "Trecho específico disponível nas novas correções."}”
                    </blockquote>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#24365F]">
                      Como melhorar
                    </p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--ink-2)]">
                      {c.como_melhorar || c.analise}
                    </p>
                  </div>
                </div>
              )}
              {isPartialPreview && (
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--red)]">
                  Prévia da competência 1
                </p>
              )}
              {isLockedPreview && (
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--red)]/25 bg-[var(--paper)] px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--red)] shadow-sm">
                    <LockKeyhole className="h-3 w-3" /> Análise pronta e bloqueada
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showPaywall && data.analise_paragrafos?.length > 0 && (
        <section className="mt-8 rounded-2xl border border-[#24365F]/20 bg-[#24365F]/[0.035] p-5 md:p-6">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#24365F]">
              Leitura linha a linha
            </p>
            <h3 className="mt-1 font-['Fraunces'] text-2xl font-black text-[var(--ink)]">
              Leitura por parágrafo
            </h3>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[var(--ink-2)]">
              Cada apontamento abaixo está ligado a um trecho literal da sua redação.
            </p>
          </div>

          <div className="space-y-4">
            {data.analise_paragrafos.map((paragrafo) => (
              <article
                key={paragrafo.numero}
                className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4 md:p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#24365F] text-xs font-black text-white">
                    {paragrafo.numero}
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--ink-3)]">
                      Função no projeto de texto
                    </p>
                    <p className="text-sm font-black text-[var(--ink)]">{paragrafo.funcao}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-medium leading-relaxed text-[var(--ink-2)]">
                  {paragrafo.diagnostico}
                </p>
                <blockquote className="mt-4 border-l-2 border-[var(--red)] pl-3 text-xs font-bold italic leading-relaxed text-[var(--ink)]">
                  “{paragrafo.evidencia}”
                </blockquote>
                <div className="mt-4 rounded-lg bg-[#24365F]/[0.06] p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#24365F]">
                    Próximo ajuste
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--ink-2)]">
                    {paragrafo.como_melhorar}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!showPaywall && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#24365F] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> Pontos Fortes
            </div>
            <ul className="space-y-2">
              {data.pontos_fortes.map((item, i) => (
                <li
                  key={i}
                  className="text-xs font-medium text-[var(--ink-2)] leading-tight flex gap-2"
                >
                  <span className="text-[var(--red)]">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--red)] mb-3 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Sugestões de Melhoria
            </div>
            <ul className="space-y-2">
              {data.sugestoes.map((item, i) => (
                <li
                  key={i}
                  className="text-xs font-medium text-[var(--ink-2)] leading-tight flex gap-2"
                >
                  <span className="text-[var(--red)]">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function getLockedCompetencyTeaser(numero: number) {
  const teasers: Record<number, string> = {
    2: "A análise verificou se o tema foi desenvolvido por completo e se o repertório realmente fortalece a argumentação.",
    3: "Seu projeto de texto foi examinado para revelar como os argumentos se conectam e sustentam o ponto de vista.",
    4: "A progressão entre frases e parágrafos foi mapeada para identificar como a coesão influencia a leitura da banca.",
    5: "Sua proposta de intervenção foi conferida nos elementos exigidos para descobrir se algum detalhe pode limitar a pontuação.",
  };

  return (
    teasers[numero] ||
    "Esta competência já foi analisada e possui uma leitura específica pronta para ser desbloqueada."
  );
}

function Bloco({
  titulo,
  itens,
  cor,
  extraItemClass = "",
}: {
  titulo: string;
  itens: string[];
  cor: string;
  extraItemClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-input/40 p-4">
      <div className={`mb-2 text-sm font-bold ${cor}`}>{titulo}</div>
      <ul className={`space-y-1.5 text-sm ${extraItemClass || "text-card-foreground"}`}>
        {itens.map((i, k) => (
          <li key={k} className="leading-snug">
            • {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
