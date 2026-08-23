# Plan: CorrigeAI Landing Page & Quiz Overhaul

Redesign the landing page and quiz component to follow the provided art direction (light "paper" theme, classic typography, and structured feedback visual).

## UI/UX Changes
- **New Landing Page Style**:
  - Implement a light-themed, minimal design inspired by the uploaded `Folha de Redação` style.
  - Background: `#FBFAF7` (Paper).
  - Typography: `Fraunces` (Serif) for headings, `Public Sans` (Sans-serif) for body.
  - Remove dark mode enforcement on the landing page (keep it light as per the "Folha de Redação" art direction).
- **Hero Section**:
  - Minimalist "VSL-style" above the fold.
  - Bold serif headline with high contrast.
- **Quiz Refinement**:
  - Update the `Quiz` component to match the new art direction.
  - Use rounded-3xl cards with soft shadows and the light paper color palette.
- **Visual Feedback**:
  - Ensure the "Locked Preview" (blurred state) uses the new light-themed colors.

## Technical Details
- **Fonts**: Load `Fraunces` and `Public Sans` via Google Fonts in `src/routes/__root.tsx`.
- **Styling**: Define the new paper-themed tokens in `src/styles.css` (or locally in components where needed).
- **Components to update**:
  - `src/routes/index.tsx`: Update layout and colors.
  - `src/components/Quiz.tsx`: Update visual styling.
  - `src/components/EssaySubmissionArea.tsx`: Adjust the paywall/blurred state colors for the light theme.

## Constraints
- Verbatim text requirement from user: Add the literal text "Aqui segue uma direção de arte de como quero que seja visualmente, depois vou passando as proximas tarefas" to the `body` element of `src/routes/index.tsx`.
