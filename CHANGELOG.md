# Changelog

## 2026-02-26 — Monetary System / Shekels (persist v15)

Players now have a proper monetary currency (₪ shekels). Tile purchases deduct shekels instead of wheat. Crops can be sold in bulk for shekels via new sell buttons in the HUD.

- **`shekels: number`** added to `GameState`; initial value 5,000₪.
- **`sellCrops(cropType)`** action — sells 10 of a crop for: wheat=₪50, barley=₪70, grapes=₪100.
- **`buyTile`** now deducts shekels (not wheat); guard changed to `s.shekels < price`.
- **`WheatCounter`** HUD updated: shows `₪ {shekels}` row at top; sell buttons appear next to each crop (disabled when < 10).
- **Constants**: `INITIAL_SHEKELS = 5_000`, `SELL_BULK_SIZE = 10`, `SELL_PRICE` record.
- **v15 migration**: backfills `shekels: 5000` on old saves; preserves existing value if present.

Files: `src/types/index.ts`, `src/game/constants.ts`, `src/store/game/state.ts`, `src/store/game/store-types.ts`, `src/store/game/economy-actions.ts`, `src/store/game/migrations.ts`, `src/store/game-store.ts`, `src/components/WheatCounter.tsx`, `src/components/WheatCounter.module.css`

Tests: 356 Vitest (+12 net: 8 sellCrops + 2 buyTile-shekels + 2 v15 migration tests).

## 2026-02-25 — Farm Structures / Buildings (persist v14)

Players can now purchase structure tiles (🏗️ מבנים) and build one of four structures in each of the tile's four slots: Farmhouse, Barn, Sheep Fold, or Silo.

- **`BuildingGrid`** — 2×2 grid component that reads `buildingSlots` from store and renders `BuildingSlotTile` for the given `tileCoord` (mirrors `FarmGrid`).
- **`BuildingTileContent`** — thin wrapper around `BuildingGrid`, analogous to `FarmTileContent`.
- **`MapTileView`** updated: purchased tiles with `category === 'structure'` now render `BuildingTileContent`.
- **`LockedTileContent`** updated: root buy step now has a third button (🏗️ מבנים) that purchases a structure tile directly (no sub-step needed).
- **Pre-existing TS fix**: backfilled missing `stepWaitDuration: null` on `Plot` literals in `PlotTile.test.tsx` and `game-store.orchard.dilemma-gating.test.ts`.

Files: `src/components/BuildingGrid.tsx`, `src/components/BuildingGrid.module.css`, `src/components/WorldMap/BuildingTileContent.tsx`, `src/components/WorldMap/MapTileView.tsx`, `src/components/WorldMap/LockedTileContent.tsx`, `src/components/PlotTile.test.tsx`, `src/store/game-store.orchard.dilemma-gating.test.ts`

Tests: 344 Vitest (+28 net: 4 BuildingGrid, 1 BuildingTileContent, 2 LockedTileContent structure routing, plus prior session's 10 store + 10 BuildingSlotTile tests).

## 2026-02-25 — Orchard Step-Wait Progress Ring (persist v13)

Orchard plots in the `fertilized` and `tended` states now show a teal progress ring while their step-wait timer counts down (analogous to the gold growth ring during `growing`).

- **`Plot.stepWaitDuration: number | null`** — stores the duration of the current step wait, set alongside `nextActionAt` by `fertilizePlot` / `tendPlot`, cleared in `tickPlot`.
- **`stepWaitProgress(plot, now)`** — pure function in `game-tick.ts` that computes `[0, 1]` progress for the step-wait timer.
- **`ProgressRing`** updated to handle step-wait states (`fertilized`/`tended` with `nextActionAt !== null`) in addition to `growing`; teal `#7cb9a0` color for step-wait vs gold `#d4a017` for growth.
- **v13 migration** backfills `stepWaitDuration: null` on all existing plots.

Files: `src/types/index.ts`, `src/game/game-tick.ts`, `src/store/game/plot-actions.ts`, `src/store/game/state.ts`, `src/store/game/migrations.ts`, `src/store/game-store.ts`, `src/components/PlotTile.tsx`

Tests: 316 Vitest (+12: 6 `stepWaitProgress` unit, 2 v13 migration, 4 ProgressRing visibility).

## 2026-02-24 — Kebab-Case File Rename (Refactor Phase 5)

Renamed all non-component source, hook, store, and test files from camelCase to kebab-case.
Components retain PascalCase per React convention. 22 files renamed, all import paths updated.

Files changed: `src/game/game-tick.ts`, `src/game/world-map.ts`, `src/hooks/use-game-loop.ts`,
`src/hooks/use-pan.ts`, `src/store/game-store.ts`, `src/store/world-store.ts`,
`src/store/game/{dilemma,economy,plot}-actions.ts`, `src/store/game/store-types.ts`,
`src/test-utils/game-store.ts`, plus 11 test file renames.

Tests: 304 Vitest (all passing).

## 2026-02-23 — Manage Decisions Panel (persist v12)

Players can now review all dilemmas they have encountered and toggle per-dilemma auto-resolve via a bottom-sheet panel opened with the ⚙ button in MetersBar.

- **`enabled: boolean`** added to `SavedFieldDecision` — when false, auto-resolve is skipped and the dilemma modal appears instead.
- **`encounteredDilemmas: string[]`** added to `GameState` — accumulates every dilemma key the player has seen; drives the panel list.
- **`toggleDecisionEnabled(key)`** new store action — flips `enabled` immutably.
- **`harvest()`** / **`gatherSheafs()`** updated: track encounters into `encounteredDilemmas`; guard auto-resolve behind `saved.enabled`.
- **`resolveDilemma()`** saves decisions with `enabled: true`.
- **Persist v12**: migration backfills `encounteredDilemmas: []` and `enabled: true` on all existing saved decisions.
- **`DecisionsPanel`**: bottom-sheet modal listing saveable dilemmas (peah/shikchah only); checkboxes toggle enabled; cycles-remaining badge; "no saved choice" note; backdrop/close-button dismiss.
- **`MetersBar`**: gains `onManageDecisions` prop and ⚙ gear button; `App.tsx` wires local `showDecisions` state.

**Files changed:** `src/types/index.ts`, `src/store/gameStore.ts`, `src/game/strings.he.ts`, `src/components/MetersBar.tsx`, `src/components/MetersBar.module.css`, `src/App.tsx`, `src/components/DecisionsPanel.tsx` (new), `src/components/DecisionsPanel.module.css` (new)

**Tests:** 304 Vitest (+37 new tests) + 7 Playwright E2E (+1 manage-decisions scenario, all passing)

## 2026-02-23 — Orchard Dilemma Redesign (ORLAH Cycles + NETA_REVAI)

Reworked the orchard harvest dilemma flow so ORLAH applies for the first 3 harvests, NETA_REVAI fires on the 4th, and no dilemma fires from cycle 5 onward. Choosing "Leave the fruit" (choice 0) now skips the gather step entirely and resets the plot with no yield.

- **`harvestCount: number`** added to `Plot` type — tracks completed orchard harvests; gates which dilemma fires each cycle.
- **`activePlotId: string | null`** added to `GameState` — records the plot that triggered a dilemma so `resolveDilemma()` can reset it on "Leave the fruit".
- **`NETA_REVAI_DILEMMA`** added to `src/game/dilemmas.ts` — fires on the 4th orchard harvest cycle.
- **`harvest()`** in `gameStore.ts` reworked: detects orchard tiles via `tileCategories[coordKey] === "orchard"` (not `cropType`); increments `harvestCount`; routes to ORLAH (cycles 1–3), NETA_REVAI (cycle 4), or auto-resolves with no dilemma (cycle 5+); sets `activePlotId`.
- **`resolveDilemma()`** in `gameStore.ts` updated: when choice 0 of ORLAH or NETA_REVAI is chosen, skips gather and resets the plot to `empty` immediately; clears `activePlotId` on every resolution.
- Persist version bumped to 11; migration v11 backfills `harvestCount: 0` and `activePlotId: null` on existing saves.

**Files changed:** `src/types/index.ts`, `src/game/dilemmas.ts`, `src/store/gameStore.ts`, `src/store/gameStore.test.ts`, `src/game/gameTick.test.ts`

**Tests:** 267 Vitest (+20 new tests) + 6 Playwright E2E (all passing)

## 2026-02-22 — Orchard Step Timeouts (nextActionAt)

Added wait timers between intermediate orchard prep steps so vineyards feel like patient, intentional care rather than instant click-through.

- **`nextActionAt: number | null`** added to `Plot` type — `null` means action available, a timestamp means locked until that time.
- **`FERTILIZE_WAIT_DURATION` / `TEND_WAIT_DURATION`** (10 s each) added to `src/game/constants.ts`.
- **`tickPlot`** extended: clears `nextActionAt` when its time has passed (runs before the `growing→ready` check); if both are due in one tick, `nextActionAt` clears first.
- **`fertilizePlot`** now sets `nextActionAt = Date.now() + 10 s` after transitioning to `fertilized`.
- **`tendPlot`** now sets `nextActionAt = Date.now() + 10 s` after transitioning to `tended` (grapes); guards against early clicks.
- **`thinShoots`** guards against `nextActionAt !== null` (blocked until timer clears).
- **PlotTile UI**: fertilized and tended buttons show `disabled` + `(Ns)` countdown when locked; `isInteractive` and `handleClick` both respect the lock. New `.lockedBtn` CSS style (muted / greyed out).
- Persist version bumped to 10; migration v10 backfills `nextActionAt: null` on all existing plots.

**Files changed:** `src/types/index.ts`, `src/game/constants.ts`, `src/game/gameTick.ts`, `src/game/gameTick.test.ts`, `src/store/gameStore.ts`, `src/store/gameStore.test.ts`, `src/components/PlotTile.tsx`, `src/components/PlotTile.module.css`, `src/components/PlotTile.test.tsx`

**Tests:** 247 Vitest (+20 new tests) + 6 Playwright E2E (all passing)

## 2026-02-22 — Crop-Qualified Saved Decisions (Peah/Shikchah for Wheat & Barley Independently)

Removed the Omer dilemma from barley harvest and replaced it with PEAH (same as wheat). Barley and wheat now each have independent saved long-term decisions — saving a PEAH decision for wheat does not affect barley and vice versa.

- **Omer dilemma removed**: barley harvest no longer triggers OMER; it now triggers PEAH_DILEMMA just like wheat.
- **Crop-qualified save keys**: `savedFieldDecisions` keys changed from `"peah"` / `"shikchah"` to `"peah:wheat"` / `"peah:barley"` / `"shikchah:wheat"` / `"shikchah:barley"`. Each crop has its own independent countdown.
- **`activeDilemmaContext: CropType | null`** added to `GameState` — tracks which crop triggered the current active dilemma so `resolveDilemma` can build the correct crop-qualified save key.
- `DilemmaModal` reads `activeDilemmaContext` to look up the correct saved badge.
- Persist version bumped to 8; migration renames `"peah"` → `"peah:wheat"` and `"shikchah"` → `"shikchah:wheat"` for existing saves.

**Files changed:** `src/types/index.ts`, `src/store/gameStore.ts`, `src/game/dilemmas.ts`, `src/game/dilemmas.test.ts`, `src/store/gameStore.test.ts`, `src/components/DilemmaModal.tsx`

**Tests:** 197 Vitest (unchanged count — replaced Omer tests with "omer removed" guard + added barley independence tests)

## 2026-02-22 — Save Dilemma Decision for 5 Cycles (Peah & Shikchah)

Field-crop dilemma choices can now be remembered and auto-applied for 5 harvest cycles.

- **Save checkbox** appears in the dilemma modal for PEAH (wheat harvest) and SHIKCHAH (wheat/barley gather). OMER and ORLAH dilemmas are never saveable.
- When checked, the chosen decision is stored with `cyclesRemaining: 5`. On the next 5 occurrences the dilemma auto-resolves silently — no modal shown — and the cycle count decrements. At 0 the entry is deleted and the modal returns.
- A **saved badge** in the modal shows "שָׁמוּר · N מחזורים נותרים" when a decision is already active for that dilemma.
- `SavedFieldDecision` type added to `src/types/index.ts`; `savedFieldDecisions` field added to `GameState`.
- `applyDilemmaChoice` and `decrementSaved` pure helpers extracted in `gameStore.ts`.
- Persist version bumped to 7; migration backfills `savedFieldDecisions: {}` for old saves.

**Files changed:** `src/types/index.ts`, `src/store/gameStore.ts`, `src/game/strings.he.ts`, `src/components/DilemmaModal.tsx`, `src/components/DilemmaModal.module.css`, `src/store/gameStore.test.ts`

**Tests:** 197 Vitest (was 180, +17 new store tests)

## 2026-02-22 — Tile Category Reorganization (Field vs Orchard)

Reorganized tile categories from 3 legacy values (`farm`/`vineyard`/`field`) to 2 semantic categories matching biblical agricultural taxonomy:

- **Field (שדה)** — annual crops: wheat (חיטה 🌾), barley (שעורה 🌿)
- **Orchard (כרם)** — perennial vines: grapes (🍇)

**Buy-tile UI** is now a 2-step flow: pick category (Field / Orchard) → pick crop → purchase. Each step has a "← חזור" back button.

**Files changed:** `src/types/index.ts`, `src/store/gameStore.ts`, `src/components/WorldMap/LockedTileContent.tsx`, `src/components/WorldMap/LockedTileContent.module.css`, `src/components/WorldMap/LockedTileContent.test.tsx`, `src/components/WorldMap/MapTileView.tsx`, `src/store/gameStore.test.ts`

**Persist version** bumped to 6; migration renames old keys (`"farm"` → `"field"`, `"vineyard"` → `"orchard"`).

**Tests:** 180 Vitest (was 176, +4 new store tests + reworked LockedTileContent tests)

## 2026-02-22 — Stage-Based Field Colors

Each farm plot tile now shows a visually distinct background color reflecting its growth stage.

| Stage     | Color   | Visual meaning       |
| --------- | ------- | -------------------- |
| empty     | #8b6914 | dry soil (unchanged) |
| plowed    | #4a2c10 | dark tilled earth    |
| growing   | #3a5c20 | lush green growth    |
| ready     | #b8720a | golden amber harvest |
| harvested | #8a7040 | pale straw / stubble |
| gathered  | #6b5820 | warm cleared field   |

`growing`, `ready`, and `gathered` also gain a colored box-shadow glow.

**Files:** `PlotTile.tsx` (+`data-state` attr), `PlotTile.module.css` (colors), `PlotTile.test.tsx` (+6 tests)
**Tests:** +6 Vitest (total: 123)

---

## 2026-02-22 — Reset Button

Added a Reset button that clears all game progress back to the initial state.

**Files:** `gameStore.ts` (`resetGame` action), `ResetButton.tsx/css/test.tsx` (new component), `App.tsx` (mounted)
**Tests:** +3 Vitest (total: 123)

---

## 2026-02-22 — Barley as a Distinct Crop Resource

Added barley as a third crop type alongside wheat and grapes, with its own resource counter, dilemma, tile category, and visual component.

**Barley stats:** 20s growth, 12 yield per harvest

**Dilemma routing:**

- `harvest` barley → OMER_DILEMMA (first barley sheaf offering)
- `gatherSheafs` barley → SHIKCHAH_DILEMMA (same as wheat — applies to all grain fields)

**Files modified:** `types/index.ts`, `game/constants.ts`, `game/dilemmas.ts`, `store/gameStore.ts` (persist v5 + migration), `PlotTile.tsx`, `WheatCounter.tsx`, `WorldMap/MapTileView.tsx`, `WorldMap/LockedTileContent.tsx` (3rd buy button)
**Files created:** `WorldMap/BarleyFieldTileContent.tsx`, `WorldMap/BarleyFieldTileContent.module.css`
**Tests:** +18 Vitest (total: 176)

---

## 2026-02-26 — Peret & Ollelot Vineyard Dilemma + cropCost rename

Added `PERET_OLLELOT_DILEMMA` that fires on every mature vineyard harvest (cycle 5+, `harvestCount >= 4`). The dilemma presents four choices for handling fallen individual grapes (פרט) and small underdeveloped clusters (עוללות), per Leviticus 19:10. It is saveable like PEAH/SHIKCHAH using the key `"peret_ollelot:grapes"`.

Renamed `DilemmaChoice.wheatCost` → `cropCost` to make cost deductions context-aware across all crop types. This also fixes a pre-existing bug where PEAH on barley harvests incorrectly deducted wheat instead of barley.

**Files modified:** `src/types/index.ts`, `src/game/dilemmas.ts`, `src/store/game/dilemma-actions.ts`, `src/components/DilemmaModal.tsx`, `src/game/dilemmas.test.ts`, `src/store/game-store.dilemmas.test.ts`, `src/store/game-store.orchard.dilemma-gating.test.ts`
**Tests:** +13 Vitest (total: 369 Vitest + 7 Playwright E2E)
