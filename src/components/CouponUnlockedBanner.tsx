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
        "relative overflow-hidden rounded-[2.5rem] bg-[#e91e63] p-6 md:p-8 shadow-[0_20px_50px_rgba(233,30,99,0.3)]",
        className,
      )}
      {...props}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-yellow-400">
            <Trophy className="h-8 w-8 fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-white/70">
              Conquista desbloqueada
            </p>
            <p className="text-xl md:text-3xl font-black leading-tight text-white tracking-tight">
              Você liberou {discountLabel} de desconto
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-2xl border-2 border-dashed border-white/30 px-4 py-2 bg-white/5">
            <span className="font-mono text-sm md:text-base font-black uppercase tracking-widest text-white/90">
              {couponCode}
            </span>
            <span className="ml-3 rounded-xl bg-yellow-400 px-3 py-1 text-[10px] md:text-xs font-black uppercase text-black shadow-lg">
              aplicado
            </span>
          </div>
          
          <div className="flex items-center gap-2 rounded-2xl bg-black/20 px-4 py-2 text-sm md:text-base font-black tabular-nums text-white">
            <Clock className="h-4 w-4 text-white/70" />
            {left === null ? "--:--" : `${mm}:${String(ss).padStart(2, "0")}`}
          </div>
        </div>

        <p className="mt-5 text-[11px] md:text-xs font-bold text-white/60">
          Passado o prazo volta para {fallbackPrice}. O contador não reinicia.
        </p>
      </div>

      {/* Brilho decorativo sutil */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
    </div>
  );
}
