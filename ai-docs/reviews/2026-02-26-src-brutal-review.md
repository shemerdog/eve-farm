# Brutal TypeScript Review (src/) — Eve
Date: 2026-02-26
Reviewer: Codex (TypeScript + small in-browser games)

This review is direct and practical. It focuses on correctness, game-loop reliability, UX clarity, performance in browser, and maintainability. File references are exact so fixes can be tracked and billed.

## Executive Summary
You have a clean separation between pure game logic (`src/game/`), state (`src/store/`), and UI. That’s good. The big failures are in the runtime loop and economy UI: step-wait timers can freeze, and tile purchasing UI is wired to the wrong currency. Both are game-breaking or trust-breaking. There are also multiple smaller UX and performance problems that will be painful as the map grows or as more orchards are added.

## Critical Issues (Fix Now)
1. Orchard step waits can freeze entirely when no plots are in `growing` state. `useGameLoop` only ticks when `anyGrowing` is true, but `tickPlot()` also unlocks `nextActionAt` for orchard steps. If all plots are `fertilized/tended` and waiting, the loop never runs and waits never clear. This is a hard progression bug.
   - File: `src/hooks/use-game-loop.ts`
   - Fix: gate on `anyGrowing || anyWaiting` (where `anyWaiting` is `nextActionAt !== null`). Consider ticking at a lower rate for waits to reduce CPU.

2. Tile purchasing UI uses wheat instead of shekels, so players are blocked from buying when they actually can afford (or vice versa). The store uses `shekels`, but UI reads `wheat` and renders wheat icon.
   - Files: `src/components/WorldMap/MapTileView.tsx`, `src/components/WorldMap/LockedTileContent.tsx`
   - Fix: use `shekels` in `MapTileView`, pass shekels-based `canAfford`, and change UI from `🌾` to `₪`.

3. Countdown labels for orchard step waits don’t update. `secondsLeft` is computed with `Date.now()` in render, but there’s no timer or store tick to force re-renders. The ProgressRing updates, but the button text freezes.
   - File: `src/components/PlotTile.tsx`
   - Fix: add a small interval when `nextActionAt !== null` that updates local state, or drive a global time tick in the store and subscribe to it.

## High Severity Issues
1. Save checkbox state in `DilemmaModal` persists between dilemmas, which is a UI footgun. Players will save decisions unintentionally because `saveChecked` doesn’t reset when a new dilemma opens.
   - File: `src/components/DilemmaModal.tsx`
   - Fix: `useEffect` on `activeDilemma?.id` to reset `saveChecked`.

2. Per-plot intervals are expensive and scale poorly. Each `PlotTile` creates its own 200ms interval for progress. On 5x5 map with multiple plots, this is unnecessary churn. You already have a central tick — use it.
   - File: `src/components/PlotTile.tsx`
   - Fix: move progress ring timing to a shared tick (store state or context), or compute progress in render based on a global `now` state.

3. Tile rendering repeatedly filters `plots`/`buildingSlots` for each tile. This is O(n*m) every render and will start to hurt with a larger map.
   - Files: `src/components/FarmGrid.tsx`, `src/components/BuildingGrid.tsx`, `src/components/WorldMap/MapTileView.tsx`
   - Fix: maintain plots/slots indexed by coord in the store, or add memoized selectors keyed by `tileCoord`.

## Medium Severity Issues
1. `useGameLoop` ties tick interval to 500ms regardless of active plot count. This is acceptable now but will drift when plot counts grow. Consider dynamic tick scheduling (only when needed) or a single `requestAnimationFrame` loop with throttling.
   - File: `src/hooks/use-game-loop.ts`

2. Non-null assertions on dilemmas will crash silently if someone edits `DILEMMAS`. You’ll hit runtime exceptions without meaningful error messages.
   - File: `src/store/game/dilemma-actions.ts`
   - Fix: assert with an explicit error and a sane fallback.

3. `PersistedGameState` type is exported before imports. It’s legal TypeScript but it violates the project’s style expectations and hurts readability.
   - File: `src/store/game/state.ts`
   - Fix: move import block to the top.

4. `BuildingTileContent` reuses `FarmTileContent.module.css`. This is confusing and hides dependency between unrelated components.
   - File: `src/components/WorldMap/BuildingTileContent.tsx`
   - Fix: give buildings their own module or rename to a neutral shared style file.

## Low Severity Issues / Debt
1. `plantWheat` naming is incorrect for barley and orchards. This is small now but will create confusion as crops expand.
   - File: `src/store/game/plot-actions.ts`
   - Fix: rename to `plantFieldCrop` or `plantCrop`.

2. Some files use 4-space indentation despite the 2-space guideline (`src/main.tsx`, `src/App.tsx`, etc.). This creates inconsistent diffs and hurts tooling.

3. UI copy uses wheat icon and costs in multiple places. You need a shared currency display abstraction so future economy changes don’t require scattered edits.

## Testing Gaps (You’ll Pay for These Later)
1. No tests cover `useGameLoop` behavior with orchard step waits. That’s how the freeze bug slipped in.
   - Add tests for `tickPlot` with `nextActionAt` and a store-level test that ensures waits resolve even without growing plots.

2. No tests validate purchase affordability in UI vs store. This is how the wheat/shekel mismatch slipped in.
   - Add a component test to ensure LockedTile uses `shekels`.

3. No tests assert that `saveChecked` resets between dilemmas.
   - Add a DilemmaModal test.

## Practical Fix Plan (Do This In Order)
1. Fix the game loop gating. Update `useGameLoop` to tick when any plot is growing OR waiting on `nextActionAt`. Add a test that reproduces the freeze and then passes.
   - Files: `src/hooks/use-game-loop.ts`, `src/store/game/plot-actions.ts`, `src/game/game-tick.ts`, `src/store/game-store.*.test.ts`

2. Fix currency mismatch in tile purchasing. Use `shekels` in `MapTileView` and update `LockedTileContent` to show `₪`.
   - Files: `src/components/WorldMap/MapTileView.tsx`, `src/components/WorldMap/LockedTileContent.tsx`, `src/components/WorldMap/LockedTileContent.module.css`

3. Fix step-wait countdown display. Introduce a shared `now` tick in store, or add a small local interval when `nextActionAt !== null` and clear it correctly.
   - File: `src/components/PlotTile.tsx`

4. Reset the save checkbox when dilemmas change. This removes accidental saved choices.
   - File: `src/components/DilemmaModal.tsx`

5. Reduce per-tile O(n*m) filtering. Add a `plotsByCoord` and `slotsByCoord` map in state, update actions to keep them in sync, and consume them in UI.
   - Files: `src/store/game/state.ts`, `src/store/game/plot-actions.ts`, `src/store/game/building-actions.ts`, `src/components/FarmGrid.tsx`, `src/components/BuildingGrid.tsx`, `src/components/WorldMap/MapTileView.tsx`

6. Clean up naming and style drift. Rename `plantWheat`, normalize indentation, and make component CSS usage explicit.
   - Files: `src/store/game/plot-actions.ts`, `src/main.tsx`, `src/App.tsx`, `src/components/WorldMap/BuildingTileContent.tsx`

## What You Did Right
- Clean split between pure game logic (`src/game/`) and UI/store layers.
- Small, readable stores and actions; no giant god-file.
- Progress UI and input gestures are simple and understandable.

If you want, I can implement the top 3 fixes quickly and add the missing tests.
