import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ArrowLeft,
  Target,
  PenLine,
  BookOpen,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { goToCheckout } from "@/lib/checkout";
import { markOnboardingPending } from "@/lib/onboarding-tour";

const questions = [
  {
    title: "Qual resultado faria você sentir que todo o esforço valeu a pena?",
    hint: "Pense na nota que faria você olhar para a redação com orgulho.",
    options: [
      "700+: quero provar que consigo evoluir",
      "800+: quero disputar uma boa vaga",
      "900+: quero fazer da redação meu diferencial",
      "Nota 1000: quero chegar no meu máximo",
    ],
  },
  {
    title: "O que mais dá insegurança quando você começa uma redação?",
    hint: "Escolha a situação que mais parece com o que acontece na hora da prova.",
    options: [
      "Dá branco e eu não sei como começar",
      "Tenho ideias, mas não consigo defendê-las",
      "Meus parágrafos parecem soltos",
      "Chego à conclusão sem saber o que propor",
    ],
  },
  {
    title: "Qual situação mais frustra você depois de terminar uma redação?",
    hint: "A resposta mostra o que pode estar atrasando sua evolução.",
    options: [
      "Recebo comentários, mas não sei aplicá-los",
      "Vejo só a nota e continuo sem entender",
      "A correção demora e eu perco o ritmo",
      "Não tenho ninguém para corrigir meu texto",
    ],
  },
  {
    title: "Hoje, qual frase mais combina com a sua rotina?",
    hint: "Seja sincero: o objetivo é encontrar um caminho possível para você.",
    options: [
      "Treino toda semana, mas quero evoluir mais",
      "Treino quando consigo encontrar tempo",
      "Só escrevo quando a prova começa a apertar",
      "Quero começar, mas ainda estou travado",
    ],
  },
  {
    title: "Quando a nota vem abaixo do que você esperava, como você se sente?",
    hint: "Isso ajuda a entender o que falta entre receber a nota e melhorar de verdade.",
    options: [
      "Reviso, mas ainda tenho dúvida se melhorei",
      "Leio a correção e não sei o que mudar",
      "Fico preso na nota e perco a confiança",
      "Nem consigo descobrir onde perdi pontos",
    ],
  },
  {
    title: "Se sua próxima correção respondesse uma coisa, o que você escolheria?",
    hint: "Escolha a resposta que deixaria seu próximo texto mais seguro.",
    options: [
      "Qual erro preciso parar de repetir primeiro?",
      "Como transformar minhas ideias em argumentos fortes?",
      "Em qual competência estou perdendo mais pontos?",
      "O que devo treinar para evoluir mais rápido?",
    ],
  },
];
const goalLabels = [
  "Chegar aos 700+",
  "Disputar os 800+",
  "Buscar os 900+",
  "Perseguir a nota 1000",
];
const barrierLabels = [
  "Começar o texto",
  "Defender as ideias",
  "Conectar os parágrafos",
  "Concluir com clareza",
];
const rhythmLabels = [
  "Treina toda semana",
  "Treina quando consegue",
  "Treina sob pressão",
  "Ainda quer começar",
];
const rhythmChallenges = [
  "treinar sem um foco claro",
  "treinar apenas quando sobra tempo",
  "treinar só quando a prova aperta",
  "ainda estar travado para começar",
];
const resultTitles = [
  "Seu bloqueio pode estar acontecendo antes mesmo da primeira linha.",
  "Você pode ter boas ideias e ainda deixar pontos escaparem na argumentação.",
  "Seu texto pode perder força quando as ideias não caminham juntas.",
  "Sua conclusão pode estar entregando menos do que você construiu.",
];
const focusInsights = [
  "Sem um começo estruturado, o branco toma tempo e sua tese pode sair confusa.",
  "Sem explicação e exemplo, boas ideias podem virar argumentos fracos.",
  "Parágrafos soltos quebram o raciocínio e dificultam a leitura.",
  "Uma proposta vaga enfraquece a conclusão e pode custar pontos na Competência 5.",
];
const feedbackInsights = [
  "Você recebe comentários, mas eles ainda não viram mudanças claras.",
  "Só a nota não mostra por que você perdeu pontos.",
  "A demora esfria o aprendizado antes do próximo texto.",
  "Sem correção, você pode repetir erros sem perceber.",
];
const reactionInsights = [
  "Compare o antes e depois para saber se melhorou.",
  "Você precisa saber exatamente o que mudar.",
  "Transforme a nota em direção, não em insegurança.",
  "Veja a competência e o trecho que custaram pontos.",
];
const actionPlans = [
  "Corrija primeiro o erro que mais se repete.",
  "Transforme uma ideia em argumento com explicação e exemplo.",
  "Priorize a competência em que pode recuperar mais pontos.",
  "Use um ciclo simples: escrever, corrigir e revisar.",
];
type Stage =
  "quiz" | "result" | "method" | "validation" | "account" | "ready" | "essential" | "combo";
const button =
  "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#16213A] px-5 py-4 text-base font-bold text-white shadow-[0_12px_28px_-18px_rgba(22,33,58,0.75)] transition-[transform,background-color,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#24365F] hover:shadow-[0_16px_32px_-18px_rgba(22,33,58,0.85)] active:translate-y-0 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50";

export function AcquisitionFunnel({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("quiz");
  const [answers, setAnswers] = useState<number[]>([]);
  const [question, setQuestion] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createdAccount, setCreatedAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [daysUntilEnem] = useState(() => {
    const examDate = new Date("2026-11-08T00:00:00-03:00");
    return Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86400000));
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("corrigeai:offer-return") || "null");
      if (saved && ["essential", "combo"].includes(saved.stage)) {
        setStage(saved.stage);
      }
    } catch {
      /* A sessão pode estar indisponível no navegador. */
    }
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    setMessage("");
  }, [stage, question]);

  async function continueToAccount() {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      setStage(data.session ? "ready" : "account");
    } finally {
      setBusy(false);
    }
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) {
        setMessage(
          "Não foi possível criar a conta. Verifique o e-mail e use uma senha de pelo menos 6 caracteres. Se já tiver cadastro, volte à página inicial para entrar.",
        );
        return;
      }
      if (data.user) {
        setCreatedAccount(true);
        markOnboardingPending(localStorage, data.user.id);
      }
      if (data.session) setStage("ready");
      else
        setMessage(
          "Confira seu e-mail: enviamos um link para confirmar a conta. Depois, entre aqui para continuar.",
        );
    } catch {
      setMessage("Falha de conexão. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function checkout(plan: "essencial" | "combo") {
    setBusy(true);
    setMessage("");
    try {
      try {
        sessionStorage.setItem("corrigeai:offer-return", JSON.stringify({ stage }));
      } catch {
        /* O checkout funciona sem armazenamento. */
      }
      await goToCheckout(plan);
    } catch {
      setMessage("Não conseguimos abrir o checkout. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const freeLink = (
    <Link
      to="/dashboard"
      onClick={() => {
        try {
          sessionStorage.removeItem("corrigeai:offer-return");
        } catch {
          /* Sem persistência. */
        }
      }}
      className="mt-5 block py-3 text-center text-sm font-semibold underline underline-offset-4"
    >
      Continuar para minha correção gratuita
    </Link>
  );
  const title = (text: string) => (
    <h1 className="mb-5 font-['Fraunces'] text-3xl font-black leading-tight md:text-5xl">{text}</h1>
  );

  return (
    <main className="corrige-soft-overlay min-h-screen bg-[var(--paper)] px-4 py-6 font-['Public_Sans'] text-[var(--ink)] md:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-lg py-2 text-sm transition-[color,transform] duration-200 hover:text-[var(--red)] active:scale-95"
          >
            ← Página inicial
          </button>
          <span className="font-['Fraunces'] text-xl font-black italic">
            CORRIGE<span className="text-[var(--red)]">AI</span>
          </span>
        </div>
        <section
          className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white/70 p-5 shadow-sm md:p-8"
          aria-live="polite"
        >
          <div key={`${stage}-${question}`} className="corrige-flow-enter">
            {stage === "quiz" && (
              <>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--red)]">
                  Seu próximo passo · {question + 1} de 6
                </p>
                <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-[#E4E0D6]">
                  <div
                    className="h-full bg-[var(--red)] transition-[width] duration-300 ease-out"
                    style={{ width: `${((question + 1) / 6) * 100}%` }}
                  />
                </div>
                {title(questions[question].title)}
                <p className="mb-6 text-sm text-[var(--ink-2)]">{questions[question].hint}</p>
                <div className="space-y-3">
                  {questions[question].options.map((option, index) => (
                    <button
                      key={option}
                      onClick={() => {
                        const next = [...answers];
                        next[question] = index;
                        setAnswers(next);
                        if (question === 5) setStage("result");
                        else setQuestion(question + 1);
                      }}
                      className={`corrige-choice-enter flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--red)] hover:bg-[var(--red-soft)] hover:shadow-sm active:translate-y-0 active:scale-[0.99] ${answers[question] === index ? "border-[var(--red)] bg-[var(--red-soft)]" : "border-[var(--line)]"}`}
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      {option}
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                  ))}
                </div>
                {question > 0 && (
                  <button
                    className="mt-5 flex items-center gap-2 rounded-lg py-2 text-sm transition-[color,transform] duration-200 hover:text-[var(--red)] active:scale-95"
                    onClick={() => setQuestion(question - 1)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                )}
              </>
            )}
            {stage === "result" && (
              <>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--red-soft)] text-[var(--red)]">
                    <Target className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-[#E9F2E9] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#27623C]">
                    Leitura concluída
                  </span>
                </div>
                {title(resultTitles[answers[1]])}
                <p className="mb-5 text-sm leading-relaxed">
                  Você quer {goalLabels[answers[0]]?.toLowerCase()}. Hoje,{" "}
                  <strong>{barrierLabels[answers[1]]?.toLowerCase()}</strong> e{" "}
                  <strong>{rhythmChallenges[answers[3]]}</strong> podem fazer pontos escaparem sem
                  você perceber.
                </p>
                <div className="mb-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Meta que te move", goalLabels[answers[0]]],
                    ["Maior trava", barrierLabels[answers[1]]],
                    ["Momento atual", rhythmLabels[answers[3]]],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[var(--line)] bg-white p-3"
                    >
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[var(--red)]">
                        {label}
                      </span>
                      <strong className="mt-2 block text-xs leading-tight">{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#C4322A]/25 bg-[#F3CECA] p-4 shadow-[0_10px_28px_-24px_rgba(196,50,42,0.9)]">
                    <strong>O que está travando</strong>
                    <p className="mt-2 text-sm leading-relaxed">
                      {focusInsights[answers[1]]} {feedbackInsights[answers[2]]}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#24365F]/20 bg-[#D3DFF0] p-4 shadow-[0_10px_28px_-24px_rgba(36,54,95,0.9)]">
                    <strong>O que fazer agora</strong>
                    <p className="mt-2 text-sm leading-relaxed">
                      {actionPlans[answers[5]]} {reactionInsights[answers[4]]}
                    </p>
                  </div>
                </div>
                <div className="my-5 flex items-start gap-3 rounded-2xl border border-[#24365F]/15 bg-[#16213A] p-4 text-white">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <strong className="text-sm">Agora compare os dois caminhos</strong>
                    <p className="mt-1 text-sm leading-relaxed text-white/85">
                      Veja a diferença entre continuar sem direção e corrigir cada erro antes da
                      próxima redação.
                    </p>
                  </div>
                </div>
                <p className="mb-5 text-xs text-[var(--ink-3)]">
                  Leitura baseada nas respostas. Sua redação ainda não foi analisada.
                </p>
                <button className={button} onClick={() => setStage("method")}>
                  Ver a diferença no gráfico <ArrowRight />
                </button>
              </>
            )}
            {stage === "method" && (
              <>
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-[var(--red)]">
                  Seus dois caminhos
                </p>
                {title("Onde você está e para onde pode ir.")}
                <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                  <strong className="text-[#C4322A]">Linha vermelha:</strong> onde você está hoje,
                  sem correção clara, repetindo dúvidas e sem transformar o esforço em evolução.{" "}
                  <strong className="text-[#2563EB]">Linha azul:</strong> o caminho de quem usa o
                  CorrigeAI para sair da dúvida: corrige, entende onde perdeu pontos, revisa e chega
                  ao próximo texto com mais direção para buscar 900+ e a vaga desejada.
                </p>
                <p className="mt-3 text-sm font-bold leading-relaxed text-[var(--ink)]">
                  Se você quer parar de repetir os mesmos erros, é esse ciclo que precisa começar
                  agora.
                </p>
                <figure className="my-6 rounded-2xl bg-[#EEF2F8] p-4">
                  <svg
                    viewBox="0 0 360 180"
                    role="img"
                    aria-label="Comparação ilustrativa entre um treino sem retorno claro e o método de correção e revisão do CorrigeAI"
                    className="w-full"
                  >
                    <path d="M25 20V150H345" fill="none" stroke="#BDC4D0" />
                    <path
                      d="M30 132L105 120L180 127L255 117L335 122"
                      fill="none"
                      stroke="#C4322A"
                      strokeWidth="4"
                      strokeDasharray="6 6"
                    />
                    <path
                      d="M30 132L105 112L180 83L255 58L335 27"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="5"
                    />
                    {[30, 105, 180, 255, 335].map((x, i) => (
                      <circle key={x} cx={x} cy={[132, 112, 83, 58, 27][i]} r="5" fill="#2563EB" />
                    ))}
                    <text x="190" y="174" fontSize="12" fill="#4C5670">
                      Ciclos de prática →
                    </text>
                  </svg>
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-[#2563EB]">
                      Com CorrigeAI: corrigir → revisar → evoluir
                    </p>
                    <p className="font-semibold text-[#C4322A]">
                      Sem direção: escrever → manter a dúvida → repetir
                    </p>
                  </div>
                </figure>
                <div className="mb-6 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  {["Envie seu texto", "Entenda os ajustes", "Treine de novo"].map((text, i) => (
                    <div key={text} className="rounded-xl border p-3">
                      <span className="mb-2 block text-xl text-[var(--red)]">0{i + 1}</span>
                      {text}
                    </div>
                  ))}
                </div>
                <button className={button} onClick={() => setStage("validation")}>
                  Quero dar o próximo passo <ArrowRight className="h-5 w-5" />
                </button>
              </>
            )}
            {stage === "validation" && (
              <>
                <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#DCE4F0] bg-white shadow-sm">
                  <div className="text-center">
                    <strong className="font-['Fraunces'] text-3xl font-black text-[#24365F]">
                      6/6
                    </strong>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-[var(--ink-3)]">
                      concluído
                    </span>
                  </div>
                </div>
                <p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-[var(--red)]">
                  Você chegou até aqui
                </p>
                {title("Você fez o que é fácil adiar: parou para entender seu treino.")}
                <p className="mb-6 text-center text-sm leading-relaxed text-[var(--ink-2)]">
                  Agora você já sabe sua meta, seu principal bloqueio e o que precisa observar no
                  próximo texto. Falta só transformar essa direção em uma correção real.
                </p>
                <div className="mb-6 space-y-3">
                  {["Meta definida", "Ponto de atenção encontrado", "Próxima ação escolhida"].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-[#24365F]/15 bg-[#EEF2F8] p-4 text-sm font-bold"
                      >
                        <Check className="h-5 w-5 shrink-0 rounded-full bg-[#24365F] p-1 text-white" />
                        {item}
                      </div>
                    ),
                  )}
                </div>
                <button disabled={busy} className={button} onClick={() => void continueToAccount()}>
                  {busy ? "Preparando seu acesso…" : "Liberar minha correção gratuita"}
                </button>
                <p className="mt-3 text-center text-xs font-semibold text-[var(--ink-3)]">
                  Cadastro rápido. Não precisa de cartão.
                </p>
              </>
            )}
            {stage === "account" && (
              <>
                {title("Falta só criar seu acesso gratuito.")}
                <p className="mb-6 text-sm">
                  Sua leitura já está pronta. Cadastre-se para liberar sua primeira correção e
                  aplicar esse direcionamento na sua redação.
                </p>
                <form onSubmit={authenticate} className="space-y-4">
                  <label className="block text-sm font-bold">
                    E-mail
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 w-full rounded-xl border bg-white p-3"
                    />
                  </label>
                  <label className="block text-sm font-bold">
                    Senha
                    <input
                      required
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-2 w-full rounded-xl border bg-white p-3"
                    />
                  </label>
                  <button disabled={busy} className={button}>
                    {busy ? "Aguarde…" : "Criar minha conta gratuita"}
                  </button>
                </form>
              </>
            )}
            {stage === "ready" && (
              <>
                <Check className="mb-5 h-12 w-12 rounded-full bg-[#E9F2E9] p-2 text-green-700" />
                {title(
                  createdAccount
                    ? "Seu acesso está liberado. Sua primeira correção já está esperando."
                    : "Seu próximo treino já pode começar.",
                )}
                <p className="mb-6 text-sm">
                  {createdAccount
                    ? "Você concluiu as perguntas, identificou seu foco e criou seu espaço de treino. Agora pode colar ou fotografar uma redação e receber sua primeira análise gratuitamente."
                    : "Você concluiu as perguntas e identificou seu foco. Agora pode entrar no seu espaço de treino para colar ou fotografar uma nova redação."}
                </p>
                <div className="mb-6 space-y-3">
                  {[
                    [PenLine, "Cole ou fotografe sua redação"],
                    [Target, "Receba a análise das 5 competências"],
                    [BookOpen, "Use os comentários para revisar"],
                  ].map(([Icon, text]) => {
                    const I = Icon as typeof PenLine;
                    return (
                      <div
                        key={String(text)}
                        className="flex items-center gap-3 rounded-2xl bg-[#EEF2F8] p-4 text-sm font-semibold"
                      >
                        <I className="h-5 w-5 shrink-0" />
                        {String(text)}
                      </div>
                    );
                  })}
                </div>
                <div className="mb-6 rounded-2xl border border-[#24365F]/25 bg-[#CBD9EC] p-5">
                  <div className="flex items-center gap-2 text-[var(--red)]">
                    <Sparkles className="h-5 w-5" />
                    <p className="text-xs font-black uppercase tracking-widest">
                      Benefício liberado
                    </p>
                  </div>
                  <h2 className="mt-3 font-['Fraunces'] text-xl font-black leading-tight">
                    Espere um minuto: você ganhou uma condição especial.
                  </h2>
                  <p className="mt-3 text-sm font-semibold leading-relaxed">
                    Por concluir todas as etapas, liberamos agora um desconto para você continuar
                    treinando com várias correções e não parar depois da primeira redação.
                  </p>
                </div>
                <button className={button} onClick={() => setStage("essential")}>
                  Ver meu desconto
                </button>
              </>
            )}
            {(stage === "essential" || stage === "combo") && (
              <>
                {stage === "essential" && (
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--red)]">
                    Seu próximo passo de estudo
                  </p>
                )}
                {title(
                  stage === "combo"
                    ? "Antes de escolher: compare o Combo"
                    : "Seu próximo texto merece mais do que uma tentativa.",
                )}
                <p className="mb-5 text-sm">
                  {stage === "combo"
                    ? "Por R$ 19,10 a mais que o Essencial, leve 13 correções extras e ferramentas para suas ideias."
                    : "São 12 oportunidades para escrever, entender o ajuste e chegar ao próximo texto sabendo exatamente o que treinar."}
                </p>
                {daysUntilEnem > 0 && (
                  <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[#24365F]/15 bg-[#16213A] p-4 text-white">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Clock3 className="h-6 w-6" />
                    </span>
                    <div>
                      <strong className="font-['Fraunces'] text-2xl font-black">
                        {daysUntilEnem} dias
                      </strong>
                      <p className="text-xs font-semibold text-white/80">
                        para transformar semanas restantes em ciclos de treino e revisão
                      </p>
                    </div>
                  </div>
                )}
                <div className="my-6 rounded-2xl border-2 border-[#24365F] bg-[#EEF2F8] p-5">
                  <h2 className="text-lg font-bold">
                    {stage === "combo" ? "Combo Nota 1000" : "Essencial"}
                  </h2>
                  <p className="mt-4 text-sm text-[var(--ink-3)]">
                    <span className="sr-only">De </span>
                    <s>R$ {stage === "combo" ? "59,00" : "29,90"}</s>
                  </p>
                  <p className="my-3 font-['Fraunces'] text-5xl font-black">
                    R$ {stage === "combo" ? "39,00" : "19,90"}
                  </p>
                  <p className="text-sm font-bold">
                    Pagamento único · {stage === "combo" ? "25" : "12"} correções
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#24365F]">
                    Economize R$ {stage === "combo" ? "20,00" : "10,00"}
                  </p>
                  <div className="mt-4 space-y-3 text-sm font-semibold">
                    {[
                      "Acesso vitalício à ferramenta",
                      "Histórico de redações",
                      "Histórico de progresso",
                      ...(stage === "combo"
                        ? ["Biblioteca de conectivos", "Mais de 70 repertórios disponíveis"]
                        : []),
                    ].map((benefit) => (
                      <p key={benefit} className="flex items-center gap-2.5">
                        <Check className="h-5 w-5 shrink-0 rounded-full bg-[#DDF4E5] p-1 text-[#208A4E]" />
                        {benefit}
                      </p>
                    ))}
                  </div>
                  <p className="mt-5 rounded-xl border border-[#24365F]/20 bg-white/80 px-4 py-3 text-center text-base font-black text-[#24365F] shadow-sm">
                    Apenas R$ {stage === "combo" ? "1,56" : "1,66"} por correção
                  </p>
                </div>
                <p className="mb-5 text-sm font-semibold">
                  <Sparkles className="mr-2 inline h-4 w-4 text-[var(--red)]" />
                  Adquirir hoje te faz alcançar a nota 1000 mais cedo.
                </p>
                <button
                  disabled={busy}
                  className={button}
                  onClick={() =>
                    stage === "essential" ? setStage("combo") : void checkout("combo")
                  }
                >
                  {busy
                    ? "Abrindo checkout…"
                    : stage === "essential"
                      ? "Obter agora"
                      : "É esse que eu quero"}
                </button>
                {stage === "combo" && (
                  <button
                    disabled={busy}
                    onClick={() => void checkout("essencial")}
                    className="mt-3 min-h-12 w-full rounded-xl border border-[#16213A] p-3 text-sm font-bold transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#EEF2F8] active:translate-y-0 active:scale-[0.985]"
                  >
                    Quero o anterior
                  </button>
                )}
                {stage === "essential" && freeLink}
              </>
            )}
            {message && (
              <p role="alert" className="mt-5 rounded-xl bg-[#EEF2F8] p-4 text-sm">
                {message}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
