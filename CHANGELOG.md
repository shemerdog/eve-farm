# Changelog

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

| Stage     | Color    | Visual meaning       |
|-----------|----------|----------------------|
| empty     | #8b6914  | dry soil (unchanged) |
| plowed    | #4a2c10  | dark tilled earth    |
| growing   | #3a5c20  | lush green growth    |
| ready     | #b8720a  | golden amber harvest |
| harvested | #8a7040  | pale straw / stubble |
| gathered  | #6b5820  | warm cleared field   |

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
