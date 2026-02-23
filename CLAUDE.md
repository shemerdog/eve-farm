# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MCP Tools

Always use:

- **Serena** for semantic code retrieval and editing (symbol lookup, find references, replace symbol bodies)
- **Context7** for up-to-date documentation on third-party libraries and frameworks

## Project Overview

**Eve** is a Township-style farming game that reconnects players with ancient Jewish/Israelite heritage through casual farming mechanics and ethical dilemmas. The tone is warm, welcoming, and non-dogmatic — cultural heritage made approachable without strict religious framing.

**Platform:** Mobile-first (desktop later).

## Current State

POC is implemented and building. The full core loop is wired: plow → sow → grow → harvest → gather → dilemma → meters. Run with `npm run dev`. Test with `npm test`.

Design documents:

- `poc-actionable-plan.md` — step-by-step build plan with component breakdown
- `POC_SCAFFOLD.md` — POC scope, core loop, success criteria
- `research-township.md` — Genre research on Township-style games

## Tech Stack

- **Vite 7 + React 19 + TypeScript** (strict mode)
- **Zustand 5** with `persist` middleware (localStorage key: `eve-game-state`)
- **CSS Modules** — no framework, scoped styles per component
- **Vitest** for unit/component tests (`npm test` — runs `src/**/*.test.{ts,tsx}`)
- **Playwright** for E2E tests (`npx playwright test` — runs `e2e/`)
- Path alias: `@/` → `src/`

## Source Structure

```
src/
  types/index.ts          — all shared TypeScript types
  game/
    constants.ts          — PLOT_COUNT, growth durations, calcTilePrice, applyWheatCost, clampMeter, FERTILIZE_WAIT_DURATION, TEND_WAIT_DURATION
    gameTick.ts           — pure tickPlot(plot, now) + growthProgress(plot, now)
    gameTick.test.ts      — unit tests for pure game logic
    worldMap.ts           — tile grid, camera math, coordsEqual, isPurchased, isAdjacentToUnlocked
    worldMap.test.ts      — unit tests for world map helpers
    dilemmas.ts           — DILEMMAS array (PEAH, SHIKCHAH, ORLAH, NETA_REVAI)
    strings.he.ts         — all Hebrew UI strings
  store/
    gameStore.ts          — root Zustand composer (wires initialState + modular action domains + persist)
    game/
      state.ts            — initialState + makePlots helpers
      plotActions.ts      — plot lifecycle actions (plow/plant/fertilize/tend/thin/tickGrowth)
      dilemmaActions.ts   — harvest/gather routing, auto-resolve, resolveDilemma, toggleDecisionEnabled, resetPlot
      economyActions.ts   — buyTile + resetGame
      migrations.ts       — persist migration logic (v2→v12), typed unknown narrowing
      storeTypes.ts       — GameActions/GameStore and SetState/GetState helper types
    worldStore.ts         — camera state only (NOT persisted, re-centers on mount)
  test-utils/
    gameStore.ts          — shared test helpers (resetGameStore, buyTileWithWheat, findPlotByCoord, patchPlot)
  hooks/
    useGameLoop.ts        — setInterval(tickGrowth, 500) while any plot is growing
    usePan.ts             — pointer-event pan + momentum for WorldMap viewport
  components/
    MetersBar             — devotion/morality/faithfulness bars (always visible)
    FarmGrid              — 2×2 grid of PlotTile components
    PlotTile              — per-plot visual + plant/harvest interaction + progress ring
    PlotTile.test.tsx     — field-crop component tests
    PlotTile.orchard.test.tsx — orchard cycle + nextActionAt component tests
    WheatCounter          — wheat/barley/grapes totals in bottom HUD
    ResetButton           — resets all game progress; ResetButton.test.tsx
    DilemmaModal          — full-screen overlay, appears on harvest/gather triggers
    WorldMap/
      WorldMap.tsx        — pannable + zoomable viewport, mounts TILES grid, wires usePan
      MapTileView.tsx     — reads store, computes props, renders FarmTileContent / VineyardTileContent / BarleyFieldTileContent / LockedTileContent
      FarmTileContent.tsx — renders FarmGrid inside the wheat farm map tile
      VineyardTileContent.tsx      — renders FarmGrid for orchard/grape tiles; VineyardTileContent.test.tsx
      BarleyFieldTileContent.tsx   — renders FarmGrid for barley field tiles; BarleyFieldTileContent.test.tsx
      ZoomControls.tsx             — zoom in/out buttons; ZoomControls.test.tsx
      LockedTileContent.tsx        — price badge, 2-step buy flow (category → crop), fog-dissolve animation
      LockedTileContent.test.tsx   — component tests: buy button enabled/disabled/calls onBuy
  App.tsx                 — root layout: MetersBar / WorldMap / WheatCounter / DilemmaModal / ResetButton
  index.css               — global reset + CSS custom properties (warm earth palette)
  setupTests.ts           — imports @testing-library/jest-dom for Vitest
e2e/
  farmInteraction.spec.ts — Playwright E2E: sow, harvest, buy tile, usePan regression
src/store/
  gameStore.economy.test.ts    — buyTile + yield/routing basics for field/orchard crops
  gameStore.dilemmas.test.ts   — saved decisions, auto-resolve, encountered tracking, enabled flags
  gameStore.orchard.test.ts    — orchard lifecycle, timers, cycle gating, skip-gather behavior
  gameStore.migrations.test.ts — migration behavior checks (v6/v12)
```

## Core Loop

**Field crops (wheat/barley):** Plow → Sow (enter `growing`) → wait → Harvest (PEAH dilemma) → Gather sheafs (SHIKCHAH dilemma) → `empty`

**Orchard (grapes):** First cycle: Plant → Fertilize → (10 s wait) → Tend → (10 s wait) → Thin Shoots → `growing` → Harvest (ORLAH or NETA_REVAI dilemma, cycle-gated) → Gather → `empty`. Subsequent cycles skip the Plant step (`hasBeenPlanted = true`). Choosing "Leave the fruit" (choice 0 of ORLAH/NETA_REVAI) skips the gather step and resets the plot to `empty` with no yield.

**Resources:** wheat (field harvest), barley (field harvest), grapes (orchard harvest) — each tracked independently in `GameState`.

**Dilemma choices** apply wheat cost (floored) and update meters; PEAH and SHIKCHAH can be saved for 5 future cycles.

## Dilemma Routing

| Trigger        | Crop                  | Condition                       | Dilemma            | Saveable                  |
| -------------- | --------------------- | ------------------------------- | ------------------ | ------------------------- |
| `harvest`      | wheat                 | —                               | PEAH_DILEMMA       | yes (`"peah:wheat"`)      |
| `harvest`      | barley                | —                               | PEAH_DILEMMA       | yes (`"peah:barley"`)     |
| `harvest`      | grapes (orchard tile) | `harvestCount` 0–2 (cycles 1–3) | ORLAH_DILEMMA      | no                        |
| `harvest`      | grapes (orchard tile) | `harvestCount` 3 (cycle 4)      | NETA_REVAI_DILEMMA | no                        |
| `harvest`      | grapes (orchard tile) | `harvestCount` ≥ 4 (cycle 5+)   | _(none)_           | —                         |
| `gatherSheafs` | wheat                 | —                               | SHIKCHAH_DILEMMA   | yes (`"shikchah:wheat"`)  |
| `gatherSheafs` | barley                | —                               | SHIKCHAH_DILEMMA   | yes (`"shikchah:barley"`) |
| `gatherSheafs` | grapes                | —                               | _(none)_           | —                         |

Orchard detection uses `tileCategories[coordKey] === "orchard"` (not `cropType`), so all future orchard subtypes automatically get the same ORLAH/NETA_REVAI cycle. Choosing choice 0 of ORLAH or NETA_REVAI skips gather entirely and resets the plot to `empty`.

Save keys are `"<dilemmaId>:<cropType>"`. When a saved decision is active, the dilemma resolves silently and `cyclesRemaining` decrements; at 0 the entry is deleted.

## Key Implementation Decisions

- **PlotState** has 9 states — field crops use `empty → plowed → growing → ready → harvested → gathered`; orchards add `planted → fertilized → tended` before `growing`. On subsequent orchard cycles `hasBeenPlanted = true` skips the `planted` step.
- **Dilemmas** are triggered by specific actions per crop: `harvest` wheat/barley → PEAH; `harvest` grapes (orchard tile) → ORLAH (cycles 1–3) / NETA_REVAI (cycle 4) / none (cycle 5+); `gatherSheafs` wheat/barley → SHIKCHAH. `activeDilemma: Dilemma | null` + `activeDilemmaContext: CropType | null` + `activePlotId: string | null` drive the modal. PEAH and SHIKCHAH can be saved for 5 cycles; keys are crop-qualified (`"peah:wheat"`, `"shikchah:barley"`, etc.).
- **nextActionAt** on `Plot` — `null` = action available; a timestamp = locked until `tickPlot` clears it. Used for orchard step timers (`FERTILIZE_WAIT_DURATION` / `TEND_WAIT_DURATION`, 10 s each).
- **Wheat rounding**: `applyWheatCost = (current, cost) => current - Math.floor(cost)` — always floors, generous to player, defined in `constants.ts`
- **Pure game logic**: `tickPlot(plot, now)` lives in `src/game/` with no React/Zustand dependency — fully unit-testable
- **harvestCount: number** on `Plot` — tracks how many times an orchard plot has been harvested; gates ORLAH (cycles 1–3), NETA_REVAI (cycle 4), no dilemma (cycle 5+). Incremented inside `harvest()`, not in `tickPlot`.
- **activePlotId: string | null** on `GameState` — set when a dilemma fires from `harvest()`; read by `resolveDilemma()` to reset the correct plot when the player chooses "Leave the fruit" (ORLAH/NETA_REVAI choice 0); cleared after resolution.
- **Persistence**: Zustand `persist` middleware saves all game state fields to localStorage; only data is persisted, not action functions. **Persist version: 12**; migrations v2–v12 handle all legacy saves (id format, field renames, backfills, `encounteredDilemmas`, `enabled` on saved decisions).
- **Timer**: `useGameLoop` hook starts/stops `setInterval` based on whether any plot is `growing`; uses wall-clock timestamps so tab backgrounding doesn't break growth

## Key Design Decisions

- Dilemmas are based on commandments (פאה, tithes) with optional "religious" vs "national" terminology
- Tithes breakdown: community teachings/Levi 10%, poor 1–3%, worship 1%; player keeps remainder
- Devotion/Morality/Faithfulness meter always visible, affected by dilemma choices
- Monetization (future): cosmetic-only, non-pay-to-win
- POC excludes: selling/money, production chains, social features

For any feature use the code patterns described at `ai-docs/TYPESCRIPT_BEST_PRACTICES.md`
