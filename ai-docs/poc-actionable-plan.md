# POC Actionable Plan — Heritage Farm Game

Goal: Get the core loop running in a browser using React 19 + Vite 6, mobile-first.

---

## Phase 1: Project Bootstrap

### 1.1 Scaffold Vite + React 19 + TypeScript

- `npm create vite@latest . -- --template react-ts`
- Verify dev server runs (`npm run dev`) and renders in browser
- Clean out boilerplate (demo CSS, logos, counter component)

### 1.2 Tooling & Structure

- Add path aliases in `vite.config.ts` (`@/` → `src/`)
- Configure `tsconfig.json` with strict mode and path aliases
- Install Zustand for game state management — lightweight, no boilerplate, ideal for game loops
- Create folder structure:
    ```
    src/
      components/     # React UI components
      store/          # Zustand game state
      game/           # Pure game logic (no React dependency)
      types/          # Shared TypeScript types
      assets/         # Placeholder sprites/icons
      App.tsx         # Root layout
      main.tsx        # Entry point
    ```

### 1.3 Mobile-First CSS Baseline

- Use plain CSS modules (no framework overhead for POC)
- Set viewport meta tag for mobile
- Base layout: fixed-height game viewport, vertical scroll prevention
- CSS custom properties for color palette (warm earth tones per art direction)

---

## Phase 2: Game State & Logic Layer (no UI yet)

Build the engine before the visuals. Everything here is pure TypeScript — testable without React.

### 2.1 Type Definitions (`src/types/`)

```ts
// Plot states form the core loop lifecycle
type PlotState = 'empty' | 'planted' | 'growing' | 'ready' | 'harvested'

type Plot = {
    id: number // 0–3
    state: PlotState
    plantedAt: number | null // timestamp
    growthDuration: number // ms, configurable for tuning
}

type MeterValues = {
    devotion: number // 0–100
    morality: number // 0–100
    faithfulness: number // 0–100
}

type DilemmaChoice = {
    label: string
    description: string
    wheatCost: number // how much wheat this choice costs
    meterEffect: Partial<MeterValues>
}

type Dilemma = {
    id: string
    title: string
    narrative: string // story context
    choices: DilemmaChoice[]
}

type GameState = {
    plots: Plot[]
    wheat: number // total harvested wheat
    meters: MeterValues
    activeDilemma: Dilemma | null
    harvestsSinceLastDilemma: number
}
```

### 2.2 Game Constants (`src/game/constants.ts`)

- `PLOT_COUNT = 4`
- `WHEAT_GROWTH_DURATION = 15_000` (15 seconds for POC — fast enough to test, slow enough to feel like waiting)
- `WHEAT_PER_HARVEST = 10`
- `HARVESTS_TO_TRIGGER_DILEMMA = 2` (dilemma appears every 2 harvests)
- `METER_INITIAL = { devotion: 50, morality: 50, faithfulness: 50 }`

### 2.3 Dilemma Definitions (`src/game/dilemmas.ts`)

**Dilemma 1 — פאה (Pe'ah: Corner of the Field)**

- Narrative: "The harvest is in. Tradition teaches to leave the corners of your field unharvested so the poor may glean."
- Choices:
    - **Leave generous corners** — lose 3 wheat, +10 morality, +5 devotion
    - **Leave minimal corners** — lose 1 wheat, +3 morality, +1 devotion
    - **Keep everything** — lose 0 wheat, −5 morality, −3 devotion

**Dilemma 2 — Tithes (Ma'aser)**

- Narrative: "With your harvest gathered, you consider how to share it with the community."
- Choices:
    - **Full tithes** (Levi 10% + poor 3% + worship 1% = ~14%) — lose 1.4 wheat (rounded), +8 faithfulness, +5 devotion, +5 morality
    - **Partial tithes** (Levi 10% only) — lose 1 wheat, +4 faithfulness, +2 devotion
    - **Skip tithes** — lose 0, −5 faithfulness, −3 devotion

### 2.4 Zustand Store (`src/store/gameStore.ts`)

Actions:

- `plantWheat(plotId)` — set plot to `planted`, record `plantedAt = Date.now()`
- `tickGrowth()` — check each planted plot: if elapsed ≥ `growthDuration`, transition to `ready`
- `harvest(plotId)` — set plot to `harvested` → then `empty`, add wheat, increment `harvestsSinceLastDilemma`, maybe trigger dilemma
- `triggerDilemma()` — pick next dilemma, set `activeDilemma`
- `resolveDilemma(choiceIndex)` — apply wheat cost + meter effects, clear `activeDilemma`
- `resetPlot(plotId)` — set plot back to `empty` (auto-reset after harvest animation)

The store uses Zustand's `subscribeWithSelector` for the timer tick — a `setInterval` that calls `tickGrowth()` every 500ms while any plot is in `planted` state.

---

## Phase 3: UI Components

### 3.1 Layout (`App.tsx`)

- Vertical mobile layout:
    ```
    ┌─────────────────────┐
    │   Meters Bar        │  ← always visible top bar
    ├─────────────────────┤
    │                     │
    │   Farm Grid         │  ← 2×2 grid of plots
    │   (4 plots)         │
    │                     │
    ├─────────────────────┤
    │   Wheat Counter     │  ← bottom HUD
    └─────────────────────┘
    ```
- Dilemma modal overlays the farm when `activeDilemma` is set

### 3.2 `<MetersBar />` Component

- Three horizontal bars (devotion, morality, faithfulness)
- Each bar: label + colored fill proportional to value (0–100)
- Colors: devotion = gold, morality = green, faithfulness = blue
- Animate width transitions on change (CSS `transition: width 0.3s`)

### 3.3 `<FarmGrid />` Component

- 2×2 CSS grid
- Renders 4 `<PlotTile />` components

### 3.4 `<PlotTile />` Component

- Visual states driven by `PlotState`:
    - `empty` — brown soil patch, "Plant" button
    - `planted` — small seedling icon
    - `growing` — growing wheat icon + circular progress indicator showing time remaining
    - `ready` — golden wheat icon, pulsing glow, "Harvest" button
    - `harvested` — brief "+10 wheat" float-up animation, then resets to `empty`
- Tap/click handlers call `plantWheat()` or `harvest()` from the store
- For POC visuals: use emoji (🌱 🌾 🌿) or simple CSS shapes — no sprite assets needed yet

### 3.5 `<WheatCounter />` Component

- Shows current wheat total with a wheat icon: `🌾 42`
- Animate number changes (count-up effect)

### 3.6 `<DilemmaModal />` Component

- Full-screen overlay with semi-transparent backdrop
- Title, narrative text, and choice buttons
- Each choice button shows: label, wheat cost, and a hint of meter effect (e.g., "↑ Morality")
- On choice selection: call `resolveDilemma()`, show brief outcome summary, then dismiss
- Modal blocks farm interaction while active

---

## Phase 4: Game Loop Integration

### 4.1 Timer System

- On mount (`App.tsx` or a `useGameLoop` hook): start a `setInterval(tickGrowth, 500)`
- `tickGrowth` compares `Date.now() - plot.plantedAt` against `growthDuration`
- Transitions: `planted` → `growing` (immediate), `growing` → `ready` (when timer elapses)
- Clean up interval on unmount

### 4.2 Dilemma Triggering

- After each harvest, check `harvestsSinceLastDilemma >= HARVESTS_TO_TRIGGER_DILEMMA`
- If yes, pick the next unresolved dilemma (cycle through the two dilemmas)
- Reset counter after triggering

### 4.3 Full Cycle Verification

Test the complete loop manually:

1. See 4 empty plots → tap to plant wheat on each
2. Watch growth progress bars fill over 15 seconds
3. Tap to harvest each plot when ready → wheat counter increases
4. After 2 harvests, dilemma modal appears
5. Make a choice → see meter bars change, wheat adjusts
6. Plots return to empty → repeat

---

## Phase 5: Polish for "Watchable" State

### 5.1 Visual Feedback

- CSS transitions on all state changes (plot backgrounds, meter bars, wheat counter)
- Subtle scale bounce on tap (`transform: scale(0.95)` → `scale(1)`)
- Float-up "+10 🌾" text on harvest (CSS animation, `@keyframes float-up`)

### 5.2 Responsive Layout

- `max-width: 430px; margin: 0 auto` to simulate mobile viewport on desktop
- Touch targets ≥ 44px (Apple HIG minimum)
- Test at 375×667 (iPhone SE) and 430×932 (iPhone 15 Pro Max)

### 5.3 Minimal Theming

- Background: warm parchment/sand color (`#f5e6c8`)
- Plot soil: earthy brown (`#8B6914`)
- Growing crops: greens (`#4a7c3f`)
- Ready crops: gold (`#d4a017`)
- Font: system font stack (no external loads)

---

## Implementation Order (Step-by-Step)

| Step | What                                                | Depends On      |
| ---- | --------------------------------------------------- | --------------- |
| 1    | Scaffold Vite + React + TS, verify browser loads    | —               |
| 2    | Define types and constants                          | —               |
| 3    | Build Zustand store with all actions                | Types           |
| 4    | Build `<PlotTile />` with plant/harvest interaction | Store           |
| 5    | Build `<FarmGrid />` (2×2 layout of plots)          | PlotTile        |
| 6    | Wire up timer system (`useGameLoop` hook)           | Store           |
| 7    | Build `<MetersBar />`                               | Store           |
| 8    | Build `<WheatCounter />`                            | Store           |
| 9    | Build `<DilemmaModal />` with choices               | Store, Dilemmas |
| 10   | Wire dilemma triggering after harvests              | Store           |
| 11   | Assemble full layout in `App.tsx`                   | All components  |
| 12   | Add CSS transitions and visual polish               | Working game    |
| 13   | Test full loop end-to-end                           | Everything      |

---

## Key Technical Decisions

| Decision              | Choice                                          | Rationale                                                                |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| State management      | Zustand                                         | Minimal boilerplate, perfect for game state with frequent updates        |
| Styling               | CSS Modules                                     | No build-time overhead, scoped by default, simple for POC                |
| Timer approach        | `setInterval` + timestamp comparison            | Resilient to tab backgrounding — uses wall-clock time, not tick counting |
| Visuals for POC       | Emoji + CSS shapes                              | Zero asset pipeline overhead, swappable later for real sprites           |
| Game logic separation | `src/game/` (pure TS) vs `src/store/` (Zustand) | Game rules testable without React; store is just the glue                |
