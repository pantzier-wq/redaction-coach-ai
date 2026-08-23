# Plan: New Quiz Flow & VSL-Style Landing Page

Change the current flow from "free first correction" to a quiz-led structure: Quiz -> Locked Preview -> Payment. The landing page will be simplified to a VSL-style layout focusing on immediate action.

## User-Facing Changes

### Landing Page (`src/routes/index.tsx`)
- Simplify the "above the fold" area to contain ONLY:
  - **Headline**: "Em 2 minutos você descobre sua nota real do ENEM e por que ela é essa."
  - **Subheadline**: "Responda 6 perguntas rápidas, cole sua redação e receba a nota nas 5 competências oficiais do ENEM."
  - **Primary CTA Button**: "DESCUBRIR MINHA NOTA AGORA →"
- Remove all benefit sections, testimonials, and price tables from the top of the page.
- The CTA button will trigger the Quiz modal.

### Quiz Component (`src/components/Quiz.tsx` - New)
- Create a multi-step quiz with 6 questions:
  1. "Qual curso você quer passar?" (Text input/Search)
  2. "Qual sua maior dificuldade hoje?" (Options: Introdução, Desenvolvimento, Proposta, Gramática)
  3. "Quantas redações você faz por mês?" (Options: 0, 1-2, 3-4, 4+)
  4. "Qual foi sua última nota no ENEM?" (Range slider or options)
  5. "Você sente que o tempo é seu maior inimigo agora?" (Yes/No)
  6. "Pronto para descobrir sua nota real?" (Final CTA)
- After the quiz, prompt for the essay text (integrated or separate step).

### Locked Preview & Paywall (`src/components/EssaySubmissionArea.tsx`)
- Remove the "1st correction free" logic.
- After submission (via quiz flow), show a "Generating results..." loading state.
- Show a "Locked Preview" (blurred results) with a persistent paywall for ALL users who haven't paid yet.
- Payment is required before account creation/login to see the first result.

## Technical Details

### Server Logic (`src/lib/correct-essay.server.ts`)
- Update `secureEssayCorrection` to remove the anonymous free attempt check (`check_anonymous_eligibility`).
- Always require a paid status or credits to return the *full* correction, or return a "preview" version (e.g., just the total score blurred) if unpaid.

### Database (`supabase/migrations/...`)
- No schema changes needed, but existing `anonymous_essay_attempts` logic will be bypassed or repurposed for "Quiz Leads".

### State Management
- Use local state or a temporary "quiz-session" to store quiz answers before payment/account creation.
