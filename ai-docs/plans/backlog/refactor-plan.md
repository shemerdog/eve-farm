# TypeScript Best Practices Refactor Plan

## Goals
- Align codebase with `TYPESCRIPT_BEST_PRACTICES.md` recommendations.
- Reduce large files, improve modularity, and tighten typing.
- Establish guardrails (lint rules + conventions) to prevent regression.

## Snapshot (Key Gaps)
- File size guideline exceeded: `src/store/gameStore.ts` (637 lines) and several large test files (e.g., `src/store/gameStore.test.ts` 1970 lines, `src/components/PlotTile.test.tsx` 592 lines).
- `any` usage in `src/store/gameStore.ts` (persisted state cast).
- Mixed file naming conventions (camelCase for non-components vs recommended kebab-case).
- No explicit global rule enforcing explicit function return types.

## Phase 1 Audit (Initial Findings)

### Guardrails / Tooling
- No ESLint config file found (no `eslint.config.*` or `.eslintrc*`), so the current `npm run lint` cannot enforce TypeScript rules.

### Explicit Return Types (Exported Functions)
- Exported components/hooks lacking explicit return types:
  - `src/components/DilemmaModal.tsx`
  - `src/components/ResetButton.tsx`
  - `src/components/DecisionsPanel.tsx`
  - `src/components/MetersBar.tsx`
  - `src/components/PlotTile.tsx`
  - `src/components/FarmGrid.tsx`
  - `src/components/WheatCounter.tsx`
  - `src/components/WorldMap/BarleyFieldTileContent.tsx`
  - `src/components/WorldMap/MapTileView.tsx`
  - `src/components/WorldMap/VineyardTileContent.tsx`
  - `src/components/WorldMap/FarmTileContent.tsx`
  - `src/components/WorldMap/WorldMap.tsx`
  - `src/components/WorldMap/ZoomControls.tsx`
  - `src/hooks/usePan.ts`
  - `src/hooks/useGameLoop.ts`

### `any` / Unsafe Types
- `src/store/gameStore.ts` uses `as any` for persisted state rehydration.

### `let` Usage (Const Candidates to Review)
- `src/store/gameStore.ts:239` (`let dilemmaToShow`)
- `src/hooks/usePan.ts:33` (`let rafId`)
- `src/hooks/usePan.ts:125` (`const wasDragging` is already const; no action)
- Tests: `src/components/DecisionsPanel.test.tsx` uses module-level `let` for mutable mocks.

### File Size (Over 500 LOC)
- `src/store/gameStore.ts` (637)
- `src/store/gameStore.test.ts` (1970)
- `src/components/PlotTile.test.tsx` (592)

### Naming Conventions (File Names)
- Non-component files use camelCase but guide recommends kebab-case:
  - Examples: `src/game/worldMap.ts`, `src/game/gameTick.ts`, `src/store/gameStore.ts`, `src/hooks/useGameLoop.ts`.
  - Components already follow PascalCase as recommended.

## Plan

### Phase 1: Audit + Guardrails
- Inventory functions lacking explicit return types and document targets.
- Inventory `let` usages and confirm whether `const` can replace.
- Inventory mutable updates in game/store logic and identify safe immutability improvements.
- Add/adjust ESLint rules to enforce:
  - `@typescript-eslint/explicit-function-return-type`
  - `@typescript-eslint/consistent-type-imports`
  - `@typescript-eslint/no-explicit-any`
  - `prefer-const`
  - `@typescript-eslint/explicit-module-boundary-types`
- Define naming rules in `CLAUDE.md` or a short `CONTRIBUTING.md` section (file naming, casing, component file naming, type-only imports).

### Phase 2: Modularize Large Files
- Split `src/store/gameStore.ts` into feature slices:
  - `src/store/game/` with `actions.ts`, `selectors.ts`, `reducers.ts` (or `slice` pattern).
  - Keep the Zustand store composition in `src/store/gameStore.ts` and delegate logic.
- Split large tests by domain:
  - `src/store/gameStore.*.test.ts` (e.g., `gameStore.harvest.test.ts`, `gameStore.dilemmas.test.ts`).
  - `src/components/PlotTile.*.test.tsx` (e.g., interaction vs rendering).
- Extract repeated test setup into helpers in `src/test-utils/` (or `src/testing/`).

### Phase 3: Remove `any` and Strengthen Types
- Replace persisted state `as any` cast with a typed shape and runtime guards.
  - Introduce `type PersistedGameState = Pick<GameState, ...>` and a validator.
  - Use `unknown` for deserialization and narrow safely.
- Audit any `unknown` conversions and enforce narrow checks before use.

### Phase 4: Function Signatures and Parameters
- Add explicit return types for non-component functions in:
  - `src/game/` and `src/store/` helpers.
  - `src/hooks/` utilities.
- If functions exceed 3 parameters, refactor to a single options object with a named type.
- Ensure boolean names are prefixed with `is/has/can` where relevant.

### Phase 5: File and Directory Naming
- Decide and execute naming standard changes for non-component files:
  - Option A (strict best practice): rename to kebab-case (e.g., `game-store.ts`).
  - Option B (minimal churn): keep existing file names but enforce within new files.
- Update barrel exports and import paths after any rename.

### Phase 6: Immutability and SRP Pass
- Identify direct mutations in `src/game/` and `src/store/` and refactor to pure updates.
- Break long functions into smaller, single-responsibility helpers with explicit return types.

### Phase 7: Verification
- Run `npm test`, `npm run lint`, and `npm run build` after each major refactor.
- Ensure no public API regressions for components and store interfaces.

## Deliverables
- Refactored store structure with smaller files and typed persisted state.
- Updated linting rules and naming conventions documentation.
- Reduced file sizes and clearer test organization.
- Explicit return types and consistent type-only imports across the codebase.
