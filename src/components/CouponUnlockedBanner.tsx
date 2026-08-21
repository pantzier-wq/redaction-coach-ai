import { useEffect, useState } from "react";
import { Clock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CouponUnlockedBannerProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /** Valor do desconto já aplicado, ex: "R$ 10,00" */
  discountLabel: string;
  /** Nome fictício do cupom, ex: "PRIMEIRAREDACAO" */
  couponCode: string;
  /** Preço cheio para o qual volta ao fim do prazo, ex: "R$ 29,90" */
  fallbackPrice: string;
  /** Duração da urgência em segundos (default 15 min) */
  durationSeconds?: number;
}

/**
 * Faixa de "conquista desbloqueada" com cupom aplicado + contador de urgência.
 * Puramente visual: não altera preço nem checkout.
 */
export function CouponUnlockedBanner({
  discountLabel,
  couponCode,
  fallbackPrice,
  durationSeconds = 900,
  className,
  ...props
}: CouponUnlockedBannerProps) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    setLeft(durationSeconds);
    const id = setInterval(() => {
      setLeft((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [durationSeconds]);

  const mm = left === null ? 0 : Math.floor(left / 60);
  const ss = left === null ? 0 : left % 60;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/40 bg-primary/15 p-5 shadow-[0_0_30px_-10px_hsl(var(--primary))]",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 blur-2xl"
        style={{ background: "var(--gradient-cta)" }}
        aria-hidden
      />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/25">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
              Conquista desbloqueada
            </p>
            <p className="text-lg md:text-2xl font-black leading-tight text-foreground">
              Você liberou {discountLabel} de desconto
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              {couponCode}
            </span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-primary-foreground">
              aplicado
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black tabular-nums text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {left === null ? "--:--" : `${mm}:${String(ss).padStart(2, "0")}`}
          </span>
        </div>

        <p className="mt-3 text-[11px] font-bold text-foreground/60">
          Passado o prazo volta para {fallbackPrice}. O contador não reinicia.
        </p>
      </div>
    </div>
  );
}
