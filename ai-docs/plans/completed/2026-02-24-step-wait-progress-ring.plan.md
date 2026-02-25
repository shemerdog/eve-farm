# Step-Wait Progress Ring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a progress ring on orchard plots during the fertilize→tend and tend→growing step-wait timers (analogous to the existing growth ring).

**Architecture:** The data layer is already complete (`stepWaitDuration` on `Plot`, `stepWaitProgress()` pure function). This plan covers: fixing test factories, adding tests, adding a v13 persist migration, and wiring the ring into `PlotTile`.

**Tech Stack:** React 19, TypeScript strict, Vitest + RTL, Zustand 5 persist v12→v13.

---

## Progress Update (2026-02-24)

### Completed
- Task 1: `stepWaitDuration: null` added to `makePlot` factory in `game-tick.test.ts`
- Task 2: `stepWaitProgress` import added; 5 `stepWaitProgress` tests + 1 `stepWaitDuration` cleared test added and committed
- Task 3: v13 migration block added to `migrations.ts`; persist version bumped to 13 in `game-store.ts`

### Remaining
- Task 4: Add v13 migration test in `game-store.migrations.test.ts`
- Task 5: Fix `stepWaitDuration` in `PlotTile.orchard.test.tsx` plot literals
- Task 6: Wire `ProgressRing` in `PlotTile` for step-wait states
- Task 7: Add `ProgressRing` visibility tests in `PlotTile.orchard.test.tsx`
- Task 8: Update docs (CHANGELOG, CLAUDE.md, MEMORY.md)

---

## What's Already Done (pre-shutdown)

- `Plot.stepWaitDuration: number | null` added to `src/types/index.ts`
- `stepWaitProgress(plot, now)` added to `src/game/game-tick.ts`
- `fertilizePlot` and `tendPlot` set `stepWaitDuration` alongside `nextActionAt`
- `tickPlot` clears `stepWaitDuration: null` when `nextActionAt` clears
- `makePlots` in `src/store/game/state.ts` initializes `stepWaitDuration: null`

---

### Task 1: Fix `makePlot` factory in `game-tick.test.ts`

**Files:**
- Modify: `src/game/game-tick.test.ts`

**Step 1: Add `stepWaitDuration: null` to `makePlot`**

Find the `makePlot` factory (line ~5) and add the missing field:

```ts
const makePlot = (overrides: Partial<Plot> = {}): Plot => ({
    id: '2_2_0',
    state: 'growing',
    plantedAt: Date.now(),
    growthDuration: 15_000,
    tileCoord: { col: 2, row: 2 },
    cropType: 'wheat',
    hasBeenPlanted: false,
    nextActionAt: null,
    stepWaitDuration: null,   // <-- add this line
    harvestCount: 0,
    ...overrides,
})
```

**Step 2: Run tests**

```bash
npm test -- --reporter=verbose src/game/game-tick.test.ts
```

Expected: all tests pass.

---

### Task 2: Add `stepWaitProgress` tests in `game-tick.test.ts`

**Files:**
- Modify: `src/game/game-tick.test.ts`

**Step 1: Update import to include `stepWaitProgress`**

Change line 2 from:
```ts
import { tickPlot, growthProgress } from './game-tick'
```
to:
```ts
import { tickPlot, growthProgress, stepWaitProgress } from './game-tick'
```

**Step 2: Add new test block after `growthProgress` describe**

```ts
describe('stepWaitProgress', () => {
    it('returns 0 when nextActionAt is null', () => {
        const plot = makePlot({ nextActionAt: null, stepWaitDuration: 10_000 })
        expect(stepWaitProgress(plot)).toBe(0)
    })

    it('returns 0 when stepWaitDuration is null', () => {
        const now = Date.now()
        const plot = makePlot({ nextActionAt: now + 5_000, stepWaitDuration: null })
        expect(stepWaitProgress(plot, now)).toBe(0)
    })

    it('returns ~0 at the very start of the wait', () => {
        const now = Date.now()
        const duration = 10_000
        const plot = makePlot({ nextActionAt: now + duration, stepWaitDuration: duration })
        expect(stepWaitProgress(plot, now)).toBeCloseTo(0, 1)
    })

    it('returns ~0.5 halfway through the wait', () => {
        const duration = 10_000
        const startedAt = Date.now() - duration / 2
        const plot = makePlot({
            nextActionAt: startedAt + duration,
            stepWaitDuration: duration,
        })
        expect(stepWaitProgress(plot, startedAt + duration / 2)).toBeCloseTo(0.5)
    })

    it('clamps to 1 when past duration', () => {
        const duration = 10_000
        const startedAt = Date.now() - duration * 2
        const plot = makePlot({
            nextActionAt: startedAt + duration,
            stepWaitDuration: duration,
        })
        expect(stepWaitProgress(plot, startedAt + duration * 2)).toBe(1)
    })
})
```

**Step 3: Add `stepWaitDuration` cleared test inside `nextActionAt unlock` describe**

```ts
it('clears stepWaitDuration when nextActionAt clears', () => {
    const now = Date.now()
    const plot = makePlot({
        state: 'fertilized',
        plantedAt: null,
        cropType: 'grapes',
        nextActionAt: now - 1,
        stepWaitDuration: 10_000,
    })
    const result = tickPlot(plot, now)
    expect(result.nextActionAt).toBeNull()
    expect(result.stepWaitDuration).toBeNull()
})
```

**Step 4: Run tests**

```bash
npm test -- src/game/game-tick.test.ts
```

Expected: 6 new tests + all 14 existing = 20 pass.

**Step 5: Commit**

```bash
git add src/game/game-tick.test.ts
git commit -m "test(game-tick): add stepWaitProgress tests and stepWaitDuration clear assertion"
```

---

### Task 3: Add v13 persist migration

**Files:**
- Modify: `src/store/game/migrations.ts`
- Modify: `src/store/game-store.ts`

**Step 1: Add v13 migration block**

In `src/store/game/migrations.ts`, after the `if (version < 12)` block (~line 148), before the final `return`:

```ts
if (version < 13) {
    // Backfill stepWaitDuration on all plots (null = no active step wait).
    mapPlots(state, (plot) => ({
        ...plot,
        stepWaitDuration: plot.stepWaitDuration ?? null,
    }))
}
```

**Step 2: Bump persist version in `game-store.ts` line 21**

```ts
version: 13,
```

**Step 3: Run tests**

```bash
npm test
```

Expected: all 304 pass.

---

### Task 4: Add v13 migration test

**Files:**
- Modify: `src/store/game-store.migrations.test.ts`

**Step 1: Add describe block at end of file**

```ts
describe('v13 migration logic', () => {
    it('backfills stepWaitDuration: null when missing', () => {
        const raw = {
            plots: [
                {
                    id: '2_2_0', state: 'fertilized', plantedAt: null,
                    growthDuration: 30_000, tileCoord: { col: 2, row: 2 },
                    cropType: 'grapes', hasBeenPlanted: true,
                    nextActionAt: null, harvestCount: 0,
                    // stepWaitDuration intentionally absent (old save)
                },
            ],
            wheat: 0, grapes: 0, barley: 0,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            activeDilemma: null, activeDilemmaContext: null, activePlotId: null,
            purchasedCoords: [], tileCategories: {}, savedFieldDecisions: {},
            encounteredDilemmas: [],
        }
        const result = migratePersistedGameState({
            persisted: raw, version: 12,
            farmCoord: { col: 2, row: 2 }, makePlots,
        })
        expect(result.plots[0].stepWaitDuration).toBeNull()
    })

    it('preserves existing stepWaitDuration value when present', () => {
        const raw = {
            plots: [
                {
                    id: '2_2_0', state: 'fertilized', plantedAt: null,
                    growthDuration: 30_000, tileCoord: { col: 2, row: 2 },
                    cropType: 'grapes', hasBeenPlanted: true,
                    nextActionAt: Date.now() + 5_000, harvestCount: 0,
                    stepWaitDuration: 10_000,
                },
            ],
            wheat: 0, grapes: 0, barley: 0,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            activeDilemma: null, activeDilemmaContext: null, activePlotId: null,
            purchasedCoords: [], tileCategories: {}, savedFieldDecisions: {},
            encounteredDilemmas: [],
        }
        const result = migratePersistedGameState({
            persisted: raw, version: 12,
            farmCoord: { col: 2, row: 2 }, makePlots,
        })
        expect(result.plots[0].stepWaitDuration).toBe(10_000)
    })
})
```

**Step 2: Run migration tests**

```bash
npm test -- src/store/game-store.migrations.test.ts
```

Expected: 9 pass (7 existing + 2 new).

**Step 3: Commit**

```bash
git add src/store/game/migrations.ts src/store/game-store.ts src/store/game-store.migrations.test.ts
git commit -m "feat(store): add v13 migration to backfill stepWaitDuration on plots"
```

---

### Task 5: Fix `stepWaitDuration` in `PlotTile.orchard.test.tsx` plot literals

**Files:**
- Modify: `src/components/PlotTile.orchard.test.tsx`

**Step 1: Add `stepWaitDuration` to every `Plot` literal**

- All unlocked plots (`nextActionAt: null`): add `stepWaitDuration: null`
- `fertilizedLocked` (has `nextActionAt: futureTime`): add `stepWaitDuration: 10_000`
- `tendedLocked` (has `nextActionAt: futureTime`): add `stepWaitDuration: 10_000`

**Step 2: Run tests**

```bash
npm test -- src/components/PlotTile.orchard.test.tsx
```

Expected: all existing tests pass.

---

### Task 6: Wire `ProgressRing` in `PlotTile` for step-wait states

**Files:**
- Modify: `src/components/PlotTile.tsx`

**Step 1: Update import (line 4)**

```ts
import { growthProgress, stepWaitProgress } from '@/game/game-tick'
```

**Step 2: Replace `ProgressRing` component (lines 13–51)**

```tsx
const ProgressRing = ({ plot }: { plot: Plot }): React.JSX.Element => {
    const [progress, setProgress] = useState(0)

    useEffect((): void | (() => void) => {
        const isStepWait =
            (plot.state === 'fertilized' || plot.state === 'tended') &&
            plot.nextActionAt !== null
        if (plot.state !== 'growing' && !isStepWait) return
        const update = (): void =>
            setProgress(isStepWait ? stepWaitProgress(plot) : growthProgress(plot))
        update()
        const id = setInterval(update, 200)
        return (): void => clearInterval(id)
    }, [plot])

    const dashOffset = RING_CIRCUMFERENCE * (1 - progress)
    const isStepWait =
        (plot.state === 'fertilized' || plot.state === 'tended') &&
        plot.nextActionAt !== null
    const strokeColor = isStepWait ? '#7cb9a0' : '#d4a017'

    return (
        <svg className={styles.progressRing} width={36} height={36} viewBox="0 0 36 36">
            <circle
                cx={18} cy={18} r={RING_R}
                fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3}
            />
            <circle
                cx={18} cy={18} r={RING_R}
                fill="none" stroke={strokeColor} strokeWidth={3}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                style={{ transition: 'stroke-dashoffset 0.2s linear' }}
            />
        </svg>
    )
}
```

Color: gold `#d4a017` = growing; teal `#7cb9a0` = step-wait.

**Step 3: Update `ProgressRing` render condition (line ~208)**

Replace:
```tsx
{plot.state === 'growing' && <ProgressRing plot={plot} />}
```
with:
```tsx
{(plot.state === 'growing' ||
    ((plot.state === 'fertilized' || plot.state === 'tended') &&
        plot.nextActionAt !== null)) && <ProgressRing plot={plot} />}
```

**Step 4: Run full suite**

```bash
npm test
```

Expected: all 304+ tests pass.

---

### Task 7: Add `ProgressRing` visibility tests in `PlotTile.orchard.test.tsx`

**Files:**
- Modify: `src/components/PlotTile.orchard.test.tsx`

**Step 1: Add describe block at end of file**

```tsx
describe('PlotTile — ProgressRing step-wait visibility', () => {
    const grapeCoord = { col: 3, row: 2 }
    const futureTime = Date.now() + 8000

    test('renders progress ring (svg) on locked fertilized plot', (): void => {
        const plot: Plot = {
            id: '3_2_0', state: 'fertilized', plantedAt: null, growthDuration: 30000,
            tileCoord: grapeCoord, cropType: 'grapes', hasBeenPlanted: true,
            nextActionAt: futureTime, stepWaitDuration: 10_000, harvestCount: 0,
        }
        const { container } = render(<PlotTile plot={plot} />)
        expect(container.querySelector('svg')).toBeInTheDocument()
    })

    test('renders progress ring (svg) on locked tended plot', (): void => {
        const plot: Plot = {
            id: '3_2_0', state: 'tended', plantedAt: null, growthDuration: 30000,
            tileCoord: grapeCoord, cropType: 'grapes', hasBeenPlanted: true,
            nextActionAt: futureTime, stepWaitDuration: 10_000, harvestCount: 0,
        }
        const { container } = render(<PlotTile plot={plot} />)
        expect(container.querySelector('svg')).toBeInTheDocument()
    })

    test('does not render progress ring on unlocked fertilized plot', (): void => {
        const plot: Plot = {
            id: '3_2_0', state: 'fertilized', plantedAt: null, growthDuration: 30000,
            tileCoord: grapeCoord, cropType: 'grapes', hasBeenPlanted: true,
            nextActionAt: null, stepWaitDuration: null, harvestCount: 0,
        }
        const { container } = render(<PlotTile plot={plot} />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })

    test('does not render progress ring on unlocked tended plot', (): void => {
        const plot: Plot = {
            id: '3_2_0', state: 'tended', plantedAt: null, growthDuration: 30000,
            tileCoord: grapeCoord, cropType: 'grapes', hasBeenPlanted: true,
            nextActionAt: null, stepWaitDuration: null, harvestCount: 0,
        }
        const { container } = render(<PlotTile plot={plot} />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })
})
```

**Step 2: Run tests**

```bash
npm test -- src/components/PlotTile.orchard.test.tsx
```

Expected: 4 new + all existing pass.

**Step 3: Run full suite and commit**

```bash
npm test
git add src/components/PlotTile.tsx src/components/PlotTile.orchard.test.tsx
git commit -m "feat(ui): show step-wait progress ring on orchard fertilized/tended plots"
```

---

### Task 8: Update docs

Per task completion protocol:
1. Append entry to `CHANGELOG.md` — `## 2026-02-24 — Orchard Step-Wait Progress Ring`
2. Update `CLAUDE.md` — add `stepWaitDuration` to Key Implementation Decisions; bump persist to v13; add v13 to migration list
3. Update `MEMORY.md` — bump test count (~312), note `stepWaitDuration` field

---

## Test Count Target

| File | Before | After |
|------|--------|-------|
| `game-tick.test.ts` | 14 | 20 (+6) |
| `game-store.migrations.test.ts` | 7 | 9 (+2) |
| `PlotTile.orchard.test.tsx` | 19 | 23 (+4) |
| **Total** | **304** | **~312** |
