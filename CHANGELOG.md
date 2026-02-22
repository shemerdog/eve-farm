# Changelog

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
