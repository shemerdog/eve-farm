# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all application code.
- `src/components/` holds UI building blocks (e.g., `MetersBar`, `WorldMap`, `PlotTile`).
- `src/game/` contains pure game logic and helpers (no React/Zustand dependencies).
- `src/store/` contains Zustand stores for game and world state.
- `src/hooks/` contains reusable hooks like `useGameLoop` and `usePan`.
- `src/types/` centralizes shared TypeScript types.
- `e2e/` contains Playwright tests.
- `dist/` and `test-results/` are build/test artifacts.

If you need background on the POC scope or core loop, read `POC_SCAFFOLD.md` and `poc-actionable-plan.md`.

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

## Testing Guidelines
- Unit and component tests use Vitest + Testing Library.
- Test files live in `src/` and match `*.test.ts` or `*.test.tsx`.
- E2E tests live in `e2e/` and use `*.spec.ts` naming.
- Cover game logic in `src/game/` with pure tests where possible.

## Commit & Pull Request Guidelines
- Existing commits follow `type(scope): summary` (e.g., `feat(farm): add harvest loop`).
- Keep commits focused and descriptive; avoid catch-all messages.
- PRs should include a short summary, testing notes, and screenshots for UI changes. Link related issues if they exist.

## Agent Notes
- `CLAUDE.md` captures project-specific implementation details, design decisions, and current state. Review it before large changes.
