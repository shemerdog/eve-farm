# Plan: Extract ProgressRing + Fix Orchard Timer Bug

## Context

Two related improvements to the orchard UI:

1. **Extraction**: `ProgressRing` is a self-contained SVG animation component currently inline in `PlotTile.tsx` (lines 10–56). It has no business being in the same file — extract to its own dedicated file per project conventions.

2. **Bug**: After an orchard step-wait completes (fertilize→tend or tend→thin), the ring fills to 100% but the action button stays locked indefinitely. Root cause: `useGameLoop` only ticks when `anyGrowing`, so `tickPlot` never runs to clear `nextActionAt` unless another crop is growing. The store's timer stays stale and blocks the action.

---

## Changes

### 1. Create `src/components/ProgressRing.tsx`

Extract the inline component verbatim:
- Move constants `RING_R = 14` and `RING_CIRCUMFERENCE`
- Move the `ProgressRing` component — keep same props `{ plot: Plot }`, same `className={styles.progressRing}` (CSS stays co-located with positioning owner PlotTile)
- Named export: `export const ProgressRing`
- Imports needed: `react`, `@/types`, `@/game/game-tick`, `./PlotTile.module.css`

> **CSS rationale**: `.progressRing { position: absolute; bottom: 6px; inset-inline-end: 6px }` is a _layout_ rule expressing "where ProgressRing sits inside PlotTile". It stays in `PlotTile.module.css` and is passed implicitly via the class (the extracted component imports PlotTile.module.css directly for this rule). This avoids a 3-line CSS file with no purpose.

### 2. Update `src/components/PlotTile.tsx`

- Delete lines 10–56 (constants + `ProgressRing` definition)
- Add import: `import { ProgressRing } from './ProgressRing'`
- Render condition stays identical — no behavior change
- File shrinks ~50 lines

### 3. Fix `src/hooks/use-game-loop.ts`

Change the loop condition from `anyGrowing` to also include any pending timer:

```ts
// before
const anyGrowing = plots.some((p) => p.state === 'growing')

// after
const anyGrowing      = plots.some((p) => p.state === 'growing')
const anyTimerPending = plots.some((p) => p.nextActionAt !== null)
const shouldTick      = anyGrowing || anyTimerPending
```

Update `useEffect` to use `shouldTick` and dependency array `[shouldTick, tickGrowth]`.

**Why this fixes the bug:**
- Fertilize sets `nextActionAt` → `anyTimerPending` becomes `true` → loop keeps running
- `tickGrowth` calls `tickPlot` every 500ms → clears `nextActionAt` when timer expires
- Store and UI stay in sync; button unlocks immediately when ring completes

---

## Critical Files

| File | Change |
|------|--------|
| `src/components/PlotTile.tsx` | Remove inline ProgressRing + add import |
| `src/components/ProgressRing.tsx` | **New** — extracted component |
| `src/hooks/use-game-loop.ts` | Add `anyTimerPending` condition |

Read-only reference:
- `src/game/game-tick.ts` — `tickPlot` already handles `nextActionAt` correctly; no changes needed
- `src/components/PlotTile.module.css` — `.progressRing` stays here; no changes needed

---

## Risks

- **Low**: ProgressRing extraction is purely structural — same behavior, same tests
- **Low**: Game loop fix adds one `plots.some()` call per render; negligible cost
- **Watch**: `ProgressRing` imports `PlotTile.module.css` — this cross-component CSS import is an acceptable tradeoff given the rule is about positioning within PlotTile; note in commit message

---

## Verification

1. `npm test` — all 356+ Vitest tests pass (especially `PlotTile.orchard.test.tsx` lines 329+)
2. Manual orchard flow: fertilize → wait 10s (without any other crop growing) → "Tend" button unlocks immediately when ring completes
3. `npx playwright test` — E2E tests pass
