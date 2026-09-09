export function hasEssayCredit(credits: number | null | undefined) {
  return Number.isFinite(credits) && Number(credits) > 0;
}
