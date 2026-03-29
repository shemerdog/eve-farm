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

Plan document lifecycle:

- `ai-docs/plans/backlog/` stores plans for future implementation.
- Move a plan to `ai-docs/plans/active/` when execution starts.
- Move a plan to `ai-docs/plans/completed/` after implementation is complete.

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
    constants.ts          — PLOT_COUNT, growth durations, calcTilePrice, applyWheatCost, clampMeter, FERTILIZE_WAIT_DURATION, TEND_WAIT_DURATION, INITIAL_SHEKELS, SELL_BULK_SIZE, SELL_PRICE
    game-tick.ts          — pure tickPlot(plot, now) + growthProgress(plot, now) + stepWaitProgress(plot, now)
    game-tick.test.ts     — unit tests for pure game logic
    world-map.ts          — tile grid, camera math, coordsEqual, isPurchased, isAdjacentToUnlocked
    world-map.test.ts     — unit tests for world map helpers
    dilemmas.ts           — DILEMMAS array (PEAH, SHIKCHAH, ORLAH, NETA_REVAI, PERET_OLLELOT)
    strings.he.ts         — all Hebrew UI strings
  store/
    game-store.ts         — root Zustand composer (wires initialState + modular action domains + persist)
    game/
      state.ts            — initialState + makePlots + makeStructureSlots helpers
      plot-actions.ts     — plot lifecycle actions (plow/plant/fertilize/tend/thin/tickGrowth)
      dilemma-actions.ts  — harvest/gather routing, auto-resolve, resolveDilemma, toggleDecisionEnabled, resetPlot
      economy-actions.ts  — buyTile (shekels) + sellCrops + resetGame
      building-actions.ts — constructBuilding + demolishBuilding store actions
      migrations.ts       — persist migration logic (v2→v16), typed unknown narrowing
      store-types.ts      — GameActions/GameStore and SetState/GetState helper types
    world-store.ts        — camera state only (NOT persisted, re-centers on mount)
  test-utils/
    game-store.ts         — shared test helpers (resetGameStore, buyTileWithWheat, findPlotByCoord, patchPlot)
  hooks/
    use-game-loop.ts      — setInterval(tickGrowth, 500) while any plot is growing
    use-pan.ts            — pointer-event pan + momentum for WorldMap viewport
  components/
    MetersBar             — devotion/morality/faithfulness bars (always visible)
    FarmGrid              — 2×2 grid of PlotTile components
    BuildingGrid          — 2×2 grid of BuildingSlotTile components; reads buildingSlots from store; BuildingGrid.test.tsx
    BuildingSlotTile      — per-slot tile showing building type or empty prompt; BuildingSlotTile.test.tsx
    PlotTile              — per-plot visual + plant/harvest interaction + progress ring
    PlotTile.test.tsx     — field-crop component tests
    PlotTile.orchard.test.tsx — orchard cycle + nextActionAt component tests
    CropsCounter          — shekels + wheat/barley/grapes totals with sell buttons in bottom HUD
    ResetButton           — resets all game progress; ResetButton.test.tsx
    DilemmaModal          — full-screen overlay, appears on harvest/gather triggers
    WorldMap/
      WorldMap.tsx        — pannable + zoomable viewport, mounts TILES grid, wires use-pan
      MapTileView.tsx     — reads store, routes purchased tiles to WheatTileContent / VineyardTileContent / BarleyFieldTileContent / BuildingTileContent / LockedTileContent
      WheatTileContent.tsx — renders FarmGrid inside the wheat farm map tile
      VineyardTileContent.tsx      — renders FarmGrid for orchard/grape tiles; VineyardTileContent.test.tsx
      BarleyFieldTileContent.tsx   — renders FarmGrid for barley field tiles; BarleyFieldTileContent.test.tsx
      BuildingTileContent.tsx      — renders BuildingGrid for structure tiles; BuildingTileContent.test.tsx
      ZoomControls.tsx             — zoom in/out buttons; ZoomControls.test.tsx
      LockedTileContent.tsx        — price badge, 3-step buy flow (root: Field/Orchard/Structure → sub-step for field/orchard), fog-dissolve animation
      LockedTileContent.test.tsx   — component tests: 3 root buttons, buy routing, back navigation
  App.tsx                 — root layout: MetersBar / WorldMap / CropsCounter / DilemmaModal / ResetButton
  index.css               — global reset + CSS custom properties (warm earth palette)
  setupTests.ts           — imports @testing-library/jest-dom for Vitest
e2e/
  farmInteraction.spec.ts — Playwright E2E: sow, harvest, buy tile, usePan regression
src/store/
  game-store.economy.test.ts    — buyTile + yield/routing basics for field/orchard crops
  game-store.dilemmas.test.ts   — resolve/save + auto-resolve behavior for field dilemmas
  game-store.dilemmas.state-tracking.test.ts — toggle enabled, encountered tracking, enabled-flag gating
  game-store.orchard.lifecycle.test.ts — orchard action transitions and nextActionAt timer guards
  game-store.orchard.cycle.test.ts — orchard full-cycle progression and hasBeenPlanted/reset behavior
  game-store.orchard.saved-decisions.test.ts — saved SHIKCHAH auto-resolve behavior on gather
  game-store.orchard.dilemma-gating.test.ts — ORLAH/NETA_REVAI cycle gating + skip-gather resolution
  game-store.migrations.test.ts — migration behavior checks (v6/v12/v13/v14/v15/v16)
  game-store.buildings.test.ts  — structure tile purchase, buildingSlots initialization
```

## Core Loop

**Field crops (wheat/barley):** Plow → Sow (enter `Growing`) → wait → Harvest (PEAH dilemma) → Gather sheafs (SHIKCHAH dilemma) → `Empty`

**Orchard (grapes):** First cycle: Plant → Fertilize → (10 s wait) → Tend → (10 s wait) → Thin Shoots → `Growing` → Harvest (ORLAH or NETA_REVAI dilemma, cycle-gated) → Gather → `Empty`. Subsequent cycles skip the Plant step (`hasBeenPlanted = true`). Choosing "Leave the fruit" (choice 0 of ORLAH/NETA_REVAI) skips the gather step and resets the plot to `Empty` with no yield.

**Resources:** wheat (field harvest), barley (field harvest), grapes (orchard harvest) — each tracked independently in `GameState`. Crops can be sold in bulk of 10 for shekels (₪5/wheat, ₪7/barley, ₪10/grapes). **Shekels (₪)** are the monetary currency used to purchase new tiles; players start with ₪5,000.

**Dilemma choices** apply wheat cost (floored) and update meters; PEAH and SHIKCHAH can be saved for 5 future cycles.

## Dilemma Routing

| Trigger        | Crop                  | Condition                       | Dilemma            | Saveable                  |
| -------------- | --------------------- | ------------------------------- | ------------------ | ------------------------- |
| `harvest`      | wheat                 | —                               | PEAH_DILEMMA       | yes (`"peah:Wheat"`)      |
| `harvest`      | barley                | —                               | PEAH_DILEMMA       | yes (`"peah:Barley"`)     |
| `harvest`      | grapes (orchard tile) | `harvestCount` 0–2 (cycles 1–3) | ORLAH_DILEMMA      | no                        |
| `harvest`      | grapes (orchard tile) | `harvestCount` 3 (cycle 4)      | NETA_REVAI_DILEMMA | no                        |
| `harvest`      | grapes (orchard tile) | `harvestCount` ≥ 4 (cycle 5+)   | PERET_OLLELOT_DILEMMA | yes (`"peret_ollelot:Grapes"`) |
| `gatherSheafs` | wheat                 | —                               | SHIKCHAH_DILEMMA   | yes (`"shikchah:Wheat"`)  |
| `gatherSheafs` | barley                | —                               | SHIKCHAH_DILEMMA   | yes (`"shikchah:Barley"`) |
| `gatherSheafs` | grapes                | —                               | _(none)_           | —                         |

Orchard detection uses `tileCategories[coordKey] === TileCategory.Orchard` (not `cropType`), so all future orchard subtypes automatically get the same ORLAH/NETA_REVAI cycle. Choosing choice 0 of ORLAH or NETA_REVAI skips gather entirely and resets the plot to `Empty`.

Save keys are `"<dilemmaId>:<cropType>"`. When a saved decision is active, the dilemma resolves silently and `cyclesRemaining` decrements; at 0 the entry is deleted.

## Key Implementation Decisions

- **PlotState** has 9 states — field crops use `Empty → Plowed → Growing → Ready → Harvested → Gathered`; orchards add `Planted → Fertilized → Tended` before `Growing`. On subsequent orchard cycles `hasBeenPlanted = true` skips the `Planted` step.
- **Dilemmas** are triggered by specific actions per crop: `harvest` wheat/barley → PEAH; `harvest` grapes (orchard tile) → ORLAH (cycles 1–3) / NETA_REVAI (cycle 4) / PERET_OLLELOT (cycle 5+); `gatherSheafs` wheat/barley → SHIKCHAH. `activeDilemma: Dilemma | null` + `activeDilemmaContext: CropType | null` + `activePlotId: string | null` drive the modal. PEAH, SHIKCHAH, and PERET_OLLELOT can be saved for 5 cycles; keys are crop-qualified (`"peah:Wheat"`, `"shikchah:Barley"`, `"peret_ollelot:Grapes"`, etc.). `DilemmaChoice.cropCost` (renamed from `wheatCost`) is deducted from the context crop (wheat/barley/grapes).
- **nextActionAt** on `Plot` — `null` = action available; a timestamp = locked until `tickPlot` clears it. Used for orchard step timers (`FERTILIZE_WAIT_DURATION` / `TEND_WAIT_DURATION`, 10 s each).
- **stepWaitDuration: number | null** on `Plot` — stores the total duration (ms) of the current step-wait timer; set alongside `nextActionAt` by `fertilizePlot`/`tendPlot`, cleared by `tickPlot` when `nextActionAt` clears. Used by `stepWaitProgress(plot, now)` to compute ring fill.
- **ProgressRing** — renders gold ring (`#d4a017`) for `Growing` state; teal ring (`#7cb9a0`) for `Fertilized`/`Tended` states when `nextActionAt !== null`. Controlled by a single render condition in `PlotTile`.
- **Wheat rounding**: `applyWheatCost = (current, cost) => current - Math.floor(cost)` — always floors, generous to player, defined in `constants.ts`
- **Pure game logic**: `tickPlot(plot, now)` lives in `src/game/game-tick.ts` with no React/Zustand dependency — fully unit-testable
- **harvestCount: number** on `Plot` — tracks how many times an orchard plot has been harvested; gates ORLAH (cycles 1–3), NETA_REVAI (cycle 4), PERET_OLLELOT (cycle 5+). Incremented inside `harvest()`, not in `tickPlot`.
- **activePlotId: string | null** on `GameState` — set when a dilemma fires from `harvest()`; read by `resolveDilemma()` to reset the correct plot when the player chooses "Leave the fruit" (ORLAH/NETA_REVAI choice 0); cleared after resolution.
- **Structure tiles**: Purchasing a tile with `category === TileCategory.Structure` creates 4 `BuildingSlot` entries via `makeStructureSlots(coord)` stored in `buildingSlots: BuildingSlot[]`. Each slot has `buildingType: BuildingType | null` (null = empty). `MapTileView` routes structure tiles to `BuildingTileContent` → `BuildingGrid` → `BuildingSlotTile`. `LockedTileContent` root step has a third button (🏗️ מבנים) that calls `onBuy(TileCategory.Structure, TileSubcategory.Structure)` directly with no sub-step.
- **Shekels economy**: `shekels: number` on `GameState` (initial: 5,000). `buyTile` guards on `s.shekels < price` and deducts shekels. `sellCrops(cropType)` sells 10 of a crop for `10 * SELL_PRICE[cropType]` shekels (wheat=₪5, barley=₪7, grapes=₪10). `SELL_BULK_SIZE = 10`, `INITIAL_SHEKELS = 5_000` in `constants.ts`. Dilemma wheat costs are unchanged.
- **Persistence**: Zustand `persist` middleware saves all game state fields to localStorage; only data is persisted, not action functions. **Persist version: 16**; migrations v2–v16 handle all legacy saves (id format, field renames, backfills, `encounteredDilemmas`, `enabled` on saved decisions, `stepWaitDuration`, `buildingSlots`, `shekels`, enum value PascalCase conversion).
- **Timer**: `use-game-loop` hook starts/stops `setInterval` based on whether any plot is `growing`; uses wall-clock timestamps so tab backgrounding doesn't break growth

## Key Design Decisions

- Dilemmas are based on commandments (פאה, tithes) with optional "religious" vs "national" terminology
- Tithes breakdown: community teachings/Levi 10%, poor 1–3%, worship 1%; player keeps remainder
- Devotion/Morality/Faithfulness meter always visible, affected by dilemma choices
- Monetization (future): cosmetic-only, non-pay-to-win
- Shekels (₪) are the monetary currency; crops remain morally significant resources (dilemma costs stay in wheat/crops)
- POC excludes: production chains, social features

For any feature use the code patterns described at `ai-docs/TYPESCRIPT_BEST_PRACTICES.md`
