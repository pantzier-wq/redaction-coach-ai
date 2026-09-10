const ONBOARDING_PENDING_KEY = "corrigeai:onboarding:pending";

type OnboardingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function completedKey(userId: string) {
  return `corrigeai:onboarding:completed:${userId}`;
}

export function markOnboardingPending(storage: OnboardingStorage, userId?: string) {
  storage.setItem(ONBOARDING_PENDING_KEY, userId || "pending");
}

export function clearOnboardingPending(storage: OnboardingStorage) {
  storage.removeItem(ONBOARDING_PENDING_KEY);
}

export function shouldStartOnboarding(storage: OnboardingStorage, userId: string) {
  const pendingUser = storage.getItem(ONBOARDING_PENDING_KEY);
  const wasCompleted = storage.getItem(completedKey(userId)) === "1";
  return !wasCompleted && (pendingUser === "pending" || pendingUser === userId);
}

export function completeOnboarding(storage: OnboardingStorage, userId: string) {
  storage.setItem(completedKey(userId), "1");
  clearOnboardingPending(storage);
}
