# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Eve** is a Township-style farming game that reconnects players with ancient Jewish/Israelite heritage through casual farming mechanics and ethical dilemmas. The tone is warm, welcoming, and non-dogmatic — cultural heritage made approachable without strict religious framing.

**Platform:** Mobile-first (desktop later).

## Current State

POC is implemented and building. The full core loop is wired: plant → grow → harvest → dilemma → meters. Run with `npm run dev`. Test with `npm test`.

Design documents:
- `poc-actionable-plan.md` — step-by-step build plan with component breakdown
- `POC_SCAFFOLD.md` — POC scope, core loop, success criteria
- `research-township.md` — Genre research on Township-style games

## Tech Stack

- **Vite 7 + React 19 + TypeScript** (strict mode)
- **Zustand 5** with `persist` middleware (localStorage key: `eve-game-state`)
- **CSS Modules** — no framework, scoped styles per component
- **Vitest** for unit tests (`npm test`)
- Path alias: `@/` → `src/`

## Source Structure

```
src/
  types/index.ts          — all shared TypeScript types
  game/
    constants.ts          — PLOT_COUNT, WHEAT_GROWTH_DURATION, applyWheatCost, clampMeter
    gameTick.ts           — pure tickPlot(plot, now) + growthProgress(plot, now)
    gameTick.test.ts      — 11 unit tests for pure game logic
    dilemmas.ts           — DILEMMAS array (פאה + Ma'aser)
  store/
    gameStore.ts          — Zustand store: plantWheat, tickGrowth, harvest, resolveDilemma, resetPlot
  hooks/
    useGameLoop.ts        — setInterval(tickGrowth, 500) while any plot is growing
  components/
    MetersBar             — devotion/morality/faithfulness bars (always visible)
    FarmGrid              — 2×2 grid of PlotTile components
    PlotTile              — per-plot visual + plant/harvest interaction + progress ring
    WheatCounter          — wheat total in bottom HUD
    DilemmaModal          — full-screen overlay, appears after every 2 harvests
  App.tsx                 — root layout: MetersBar / FarmGrid / WheatCounter / DilemmaModal
  index.css               — global reset + CSS custom properties (warm earth palette)
```

## POC Core Loop

1. Plant wheat on any of 4 plots → plot enters `growing` state immediately
2. Wait 15 seconds for growth timer
3. Harvest ready plot → wheat +10, harvested count increments
4. After every 2 harvests → dilemma modal appears (cycles through פאה, Ma'aser)
5. Choose a dilemma option → wheat cost applied (Math.floor), meters updated, modal clears
6. Plots auto-reset to `empty` 600ms after harvest

## Key Implementation Decisions

- **PlotState** is `empty | growing | ready | harvested` — no `planted` state; planting goes directly to `growing` (simpler state machine, 4 states not 5)
- **dilemmaIndex** in `GameState` drives deterministic cycling: `DILEMMAS[dilemmaIndex % DILEMMAS.length]`, incremented on each trigger
- **Wheat rounding**: `applyWheatCost = (current, cost) => current - Math.floor(cost)` — always floors, generous to player, defined in `constants.ts`
- **Pure game logic**: `tickPlot(plot, now)` lives in `src/game/` with no React/Zustand dependency — fully unit-testable
- **Persistence**: Zustand `persist` middleware saves all game state fields to localStorage; only data is persisted, not action functions
- **Timer**: `useGameLoop` hook starts/stops `setInterval` based on whether any plot is `growing`; uses wall-clock timestamps so tab backgrounding doesn't break growth

## Key Design Decisions

- Dilemmas are based on commandments (פאה, tithes) with optional "religious" vs "national" terminology
- Tithes breakdown: community teachings/Levi 10%, poor 1–3%, worship 1%; player keeps remainder
- Devotion/Morality/Faithfulness meter always visible, affected by dilemma choices
- Monetization (future): cosmetic-only, non-pay-to-win
- POC excludes: selling/money, additional crops/animals/buildings, production chains, social features
