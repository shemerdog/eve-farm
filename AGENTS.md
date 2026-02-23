# Repository Guidelines

## Project Overview

Eve is a Township-style farming game with ethical dilemmas and warm, non-dogmatic heritage framing. Mobile-first. POC builds and runs with `npm run dev`.

## Project Structure & Module Organization

- `src/` contains all application code.
- `src/components/` holds UI building blocks (e.g., `MetersBar`, `WorldMap`, `PlotTile`).
- `src/game/` contains pure game logic and helpers (no React/Zustand dependencies).
- `src/store/` contains Zustand stores for game and world state.
  - `src/store/gameStore.ts` is the root game-store composer.
  - `src/store/game/` holds modular game-store domains (`state`, `plotActions`, `dilemmaActions`, `economyActions`, `migrations`, `storeTypes`).
- `src/hooks/` contains reusable hooks like `useGameLoop` and `usePan`.
- `src/test-utils/` contains shared test helpers (e.g., game-store setup utilities).
- `src/types/` centralizes shared TypeScript types.
- `e2e/` contains Playwright tests.
- `dist/` and `test-results/` are build/test artifacts.

If you need background on the POC scope or core loop, read `POC_SCAFFOLD.md` and `poc-actionable-plan.md`.

## Tech Stack

- Vite + React + TypeScript (strict)
- Zustand `persist` (key: `eve-game-state`)
- CSS Modules
- Vitest + Playwright
- Path alias: `@/` → `src/`

## Build, Test, and Development Commands

- `npm run dev`: start the Vite dev server.
- `npm run build`: type-check and produce a production build.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint across the repo.
- `npm test`: run Vitest once for unit/component tests.
- `npm run test:watch`: run Vitest in watch mode.
- `npx playwright test`: run E2E tests in `e2e/`.

## Coding Style & Naming Conventions

- TypeScript + React with strict type checking.
- Indentation: 2 spaces. Strings use single quotes. Semicolons are omitted.
- CSS Modules for component styles, typically paired with the component file (e.g., `PlotTile.module.css`).
- Prefer path aliases for imports (`@/game`, `@/components`).

## Core Loop (POC)

Plant → grow (15s) → harvest (+10 wheat) → every 2 harvests show dilemma → apply cost/meter changes → auto-reset after 600ms.

## Key Implementation Decisions

- Plot state: `empty | growing | ready | harvested`
- Dilemmas: `DILEMMAS[dilemmaIndex % DILEMMAS.length]`
- Wheat cost rounding: `Math.floor`
- Pure game logic in `src/game/`

## Testing Guidelines

- Unit and component tests use Vitest + Testing Library.
- Test files live in `src/` and match `*.test.ts` or `*.test.tsx`.
- Game store tests are split by domain:
  - `src/store/gameStore.economy.test.ts`
  - `src/store/gameStore.dilemmas.test.ts`
  - `src/store/gameStore.dilemmas.state-tracking.test.ts`
  - `src/store/gameStore.orchard.lifecycle.test.ts`
  - `src/store/gameStore.orchard.cycle.test.ts`
  - `src/store/gameStore.orchard.saved-decisions.test.ts`
  - `src/store/gameStore.orchard.dilemma-gating.test.ts`
  - `src/store/gameStore.migrations.test.ts`
- E2E tests live in `e2e/` and use `*.spec.ts` naming.
- Cover game logic in `src/game/` with pure tests where possible.

## Commit & Pull Request Guidelines

- Existing commits follow `type(scope): summary` (e.g., `feat(farm): add harvest loop`).
- Keep commits focused and descriptive; avoid catch-all messages.
- PRs should include a short summary, testing notes, and screenshots for UI changes. Link related issues if they exist.

## Agent Notes

- `CLAUDE.md` captures project-specific implementation details, design decisions, and current state. Review it before large changes.
