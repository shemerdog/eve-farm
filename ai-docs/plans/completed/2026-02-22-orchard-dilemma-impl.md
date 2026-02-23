# Orchard Dilemma Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework orchard dilemmas so Orlah applies to all orchard sub-types, "Leave the fruit" skips gather and resets the plot to fertilize stage, Orlah stops after 3 cycles, and the 4th cycle shows the new נטע רבעי dilemma.

**Architecture:** Add `harvestCount: number` to `Plot` and `activePlotId: string | null` to `GameState`. Cycle gating lives in `harvest()` by reading `tileCategories`. `resolveDilemma()` uses `activePlotId` to reset the plot when a "skip gather" choice is made.

**Tech Stack:** React 19, Zustand 5 (persist), Vitest, TypeScript strict.

**Design doc:** `.claude/plans/2026-02-22-orchard-dilemma-design.md`

---

### Task 1: Update types

**Files:**
- Modify: `src/types/index.ts`

Add two fields. No tests needed — TypeScript enforces correctness; broken usages will surface in Task 3.

**Step 1: Add `harvestCount` to Plot**

In `src/types/index.ts`, add `harvestCount: number;` to the `Plot` type after `nextActionAt`:

```ts
export type Plot = {
  id: string;
  state: PlotState;
  plantedAt: number | null;
  growthDuration: number;
  tileCoord: TileCoord;
  cropType: CropType;
  hasBeenPlanted: boolean;
  nextActionAt: number | null;
  harvestCount: number;          // NEW: 0 on creation; increments each harvest()
};
```

**Step 2: Add `activePlotId` to GameState**

In `src/types/index.ts`, add `activePlotId: string | null;` to `GameState` after `activeDilemmaContext`:

```ts
export type GameState = {
  plots: Plot[];
  wheat: number;
  grapes: number;
  barley: number;
  meters: MeterValues;
  activeDilemma: Dilemma | null;
  activeDilemmaContext: CropType | null;
  activePlotId: string | null;   // NEW: plotId that triggered the active dilemma
  purchasedCoords: TileCoord[];
  tileCategories: Record<string, TileCategory>;
  savedFieldDecisions: Record<string, SavedFieldDecision>;
};
```

**Step 3: Run the build to surface type errors**

```bash
npm run build 2>&1 | head -60
```

Expected: TypeScript errors about `harvestCount` missing in `makePlots` and `activePlotId` missing in `initialState`. That's correct — they'll be fixed in Task 3.

**Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add harvestCount to Plot and activePlotId to GameState"
```

---

### Task 2: Add NETA_REVAI_DILEMMA

**Files:**
- Modify: `src/game/dilemmas.ts`

**Step 1: Write the failing test**

In `src/game/gameTick.test.ts`, add at the top of the file (or a new `dilemmas.test.ts` if one doesn't exist — check with `ls src/game/`):

```ts
import { NETA_REVAI_DILEMMA, ORLAH_DILEMMA } from "@/game/dilemmas";

describe("NETA_REVAI_DILEMMA", () => {
  it("has id 'neta_revai'", () => {
    expect(NETA_REVAI_DILEMMA.id).toBe("neta_revai");
  });

  it("has exactly 2 choices", () => {
    expect(NETA_REVAI_DILEMMA.choices).toHaveLength(2);
  });

  it("choice 0 has no wheat cost", () => {
    expect(NETA_REVAI_DILEMMA.choices[0].wheatCost).toBe(0);
  });

  it("choice 0 gives faithfulness and devotion bonuses", () => {
    expect(NETA_REVAI_DILEMMA.choices[0].meterEffect.faithfulness).toBe(8);
    expect(NETA_REVAI_DILEMMA.choices[0].meterEffect.devotion).toBe(5);
  });

  it("choice 1 gives morality and devotion penalties", () => {
    expect(NETA_REVAI_DILEMMA.choices[1].meterEffect.morality).toBe(-8);
    expect(NETA_REVAI_DILEMMA.choices[1].meterEffect.devotion).toBe(-5);
  });
});
```

**Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A3 "NETA_REVAI"
```

Expected: `Cannot find module` or `NETA_REVAI_DILEMMA is not exported`.

**Step 3: Add NETA_REVAI_DILEMMA to dilemmas.ts**

Append after `ORLAH_DILEMMA` export in `src/game/dilemmas.ts`:

```ts
// Neta Revai: fourth-year fruit is holy and must be eaten in purity in Jerusalem.
// Fires only on the 4th harvest cycle of an orchard plot (harvestCount === 3).
export const NETA_REVAI_DILEMMA: Dilemma = {
  id: "neta_revai",
  title: "נֶטַע רְבָעִי — פְּרִי שְׁנַת הָרְבִיעִית",
  narrative:
    "הָעֵץ הִגִּיעַ לְשָׁנָתוֹ הָרְבִיעִית, וּפֵרוֹתָיו קֹדֶשׁ לַה׳. " +
    "הַמָּסֹרֶת מְצַוָּה לְהַעֲלוֹת אֶת הַפֵּרוֹת לִירוּשָׁלַיִם " +
    "וּלְאָכְלָם שָׁם בְּטָהֳרָה. מַה תַּעֲשֶׂה עִם הַיְּבוּל הַזֶּה?",
  choices: [
    {
      label: "שְׁמֹר לְמַסַּע הַבָּא לִירוּשָׁלָיִם",
      description:
        "אַתָּה שׁוֹמֵר אֶת הַפֵּרוֹת לִמְסִירָתָם בְּטָהֳרָה בִּירוּשָׁלָיִם",
      wheatCost: 0,
      meterEffect: { faithfulness: 8, devotion: 5 },
    },
    {
      label: "קַח אֶת הַפֵּרוֹת לְעַצְמְךָ",
      description:
        "אַתָּה לוֹקֵחַ אֶת הַפֵּרוֹת לְעַצְמְךָ בְּלִי לְהַקְדִּישָׁם",
      wheatCost: 0,
      meterEffect: { morality: -8, devotion: -5 },
    },
  ],
};
```

Also add `NETA_REVAI_DILEMMA` to the `DILEMMAS` array at the bottom:

```ts
export const DILEMMAS: Dilemma[] = [
  // ...existing entries...
  ORLAH_DILEMMA,
  NETA_REVAI_DILEMMA,
];
```

**Step 4: Run tests to verify pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A3 "NETA_REVAI"
```

Expected: all NETA_REVAI tests pass.

**Step 5: Commit**

```bash
git add src/game/dilemmas.ts src/game/gameTick.test.ts
git commit -m "feat(dilemmas): add NETA_REVAI_DILEMMA for 4th orchard cycle"
```

---

### Task 3: Wire makePlots, initialState, partialize, and migration

**Files:**
- Modify: `src/store/gameStore.ts`

This is pure wiring — no new behavior yet, just makes the build green again.

**Step 1: Add `harvestCount: 0` to makePlots**

```ts
const makePlots = (coord: TileCoord, cropType: CropType = "wheat"): Plot[] =>
  Array.from({ length: PLOT_COUNT }, (_, i) => ({
    id: `${coord.col}_${coord.row}_${i}`,
    state: "empty" as const,
    plantedAt: null,
    growthDuration: GROWTH_DURATION[cropType],
    tileCoord: coord,
    cropType,
    hasBeenPlanted: false,
    nextActionAt: null,
    harvestCount: 0,       // NEW
  }));
```

**Step 2: Add `activePlotId: null` to initialState**

```ts
const initialState: GameState = {
  plots: makePlots(FARM_COORD),
  wheat: 0,
  grapes: 0,
  barley: 0,
  meters: { ...METER_INITIAL },
  activeDilemma: null,
  activeDilemmaContext: null,
  activePlotId: null,       // NEW
  purchasedCoords: [],
  tileCategories: {},
  savedFieldDecisions: {},
};
```

**Step 3: Add `activePlotId` to partialize**

```ts
partialize: (state) => ({
  plots: state.plots,
  wheat: state.wheat,
  grapes: state.grapes,
  barley: state.barley,
  meters: state.meters,
  activeDilemma: state.activeDilemma,
  activeDilemmaContext: state.activeDilemmaContext,
  activePlotId: state.activePlotId,    // NEW
  purchasedCoords: state.purchasedCoords,
  tileCategories: state.tileCategories,
  savedFieldDecisions: state.savedFieldDecisions,
}),
```

**Step 4: Add v11 migration**

Add after the `version < 10` block:

```ts
if (version < 11) {
  state.activePlotId = state.activePlotId ?? null;
  state.plots = (state.plots ?? []).map((p: Partial<Plot>) => ({
    ...p,
    harvestCount: p.harvestCount ?? 0,
  }));
}
```

Also bump `version: 10` to `version: 11` in the persist config:

```ts
{
  name: "eve-game-state",
  version: 11,    // was 10
  // ...
}
```

**Step 5: Run the build**

```bash
npm run build 2>&1 | head -30
```

Expected: clean build, no TypeScript errors.

**Step 6: Run tests**

```bash
npm test 2>&1 | tail -10
```

Expected: all existing tests still pass (no regressions).

**Step 7: Commit**

```bash
git add src/store/gameStore.ts
git commit -m "feat(store): wire harvestCount + activePlotId into makePlots, initialState, and persist v11"
```

---

### Task 4: Update harvest() — orchard detection, harvestCount, cycle gating

**Files:**
- Modify: `src/store/gameStore.ts`
- Test: `src/store/gameStore.test.ts`

**Step 1: Add import for NETA_REVAI_DILEMMA**

In `src/store/gameStore.ts`, update the dilemmas import line:

```ts
import { DILEMMAS, ORLAH_DILEMMA, NETA_REVAI_DILEMMA } from "@/game/dilemmas";
```

**Step 2: Write failing tests**

Add a new `describe("harvest – orchard cycle gating")` block in `src/store/gameStore.test.ts`. Add this helper near the top of the test file:

```ts
import { GRAPES_PER_HARVEST } from "@/game/constants";
import type { Plot } from "@/types";

/** Inject a single "ready" orchard plot at coord {col:3, row:2} into store state. */
function setupOrchardPlot(harvestCount = 0): string {
  const coord = { col: 3, row: 2 };
  const plotId = "3_2_0";
  const plot: Plot = {
    id: plotId,
    state: "ready",
    plantedAt: Date.now() - 100_000,
    growthDuration: 30_000,
    tileCoord: coord,
    cropType: "grapes",
    hasBeenPlanted: true,
    nextActionAt: null,
    harvestCount,
  };
  useGameStore.setState({
    ...useGameStore.getState(),
    tileCategories: { "3_2": "orchard" },
    activeDilemma: null,
    activeDilemmaContext: null,
    activePlotId: null,
    plots: [plot],
    grapes: 0,
  });
  return plotId;
}
```

Then the tests:

```ts
describe("harvest – orchard cycle gating", () => {
  beforeEach(() => useGameStore.setState(useGameStore.getInitialState?.() ?? { ...useGameStore.getState() }));

  it("shows ORLAH for cycles 1–3 (harvestCount 0, 1, 2)", () => {
    for (let count = 0; count < 3; count++) {
      const plotId = setupOrchardPlot(count);
      useGameStore.getState().harvest(plotId);
      expect(useGameStore.getState().activeDilemma?.id).toBe("orlah");
    }
  });

  it("shows NETA_REVAI on cycle 4 (harvestCount 3)", () => {
    const plotId = setupOrchardPlot(3);
    useGameStore.getState().harvest(plotId);
    expect(useGameStore.getState().activeDilemma?.id).toBe("neta_revai");
  });

  it("shows no dilemma from cycle 5 onwards (harvestCount >= 4)", () => {
    const plotId = setupOrchardPlot(4);
    useGameStore.getState().harvest(plotId);
    expect(useGameStore.getState().activeDilemma).toBeNull();
    expect(useGameStore.getState().activePlotId).toBeNull();
  });

  it("increments harvestCount on each orchard harvest", () => {
    const plotId = setupOrchardPlot(0);
    useGameStore.getState().harvest(plotId);
    const plot = useGameStore.getState().plots.find((p) => p.id === plotId);
    expect(plot?.harvestCount).toBe(1);
  });

  it("sets activePlotId when orchard dilemma fires", () => {
    const plotId = setupOrchardPlot(0);
    useGameStore.getState().harvest(plotId);
    expect(useGameStore.getState().activePlotId).toBe(plotId);
  });

  it("does NOT increment harvestCount for field crops", () => {
    // Use store default state (wheat plot at farm coord)
    const plotId = "2_2_0";
    useGameStore.setState({
      ...useGameStore.getState(),
      tileCategories: {},
      plots: [{
        id: plotId,
        state: "ready",
        plantedAt: Date.now() - 100_000,
        growthDuration: 15_000,
        tileCoord: { col: 2, row: 2 },
        cropType: "wheat",
        hasBeenPlanted: false,
        nextActionAt: null,
        harvestCount: 0,
      }],
    });
    useGameStore.getState().harvest(plotId);
    const plot = useGameStore.getState().plots.find((p) => p.id === plotId);
    expect(plot?.harvestCount).toBe(0);
  });

  it("still shows PEAH for wheat (field crop)", () => {
    const plotId = "2_2_0";
    useGameStore.setState({
      ...useGameStore.getState(),
      tileCategories: {},
      activeDilemma: null,
      savedFieldDecisions: {},
      plots: [{
        id: plotId,
        state: "ready",
        plantedAt: Date.now() - 100_000,
        growthDuration: 15_000,
        tileCoord: { col: 2, row: 2 },
        cropType: "wheat",
        hasBeenPlanted: false,
        nextActionAt: null,
        harvestCount: 0,
      }],
    });
    useGameStore.getState().harvest(plotId);
    expect(useGameStore.getState().activeDilemma?.id).toBe("peah");
  });
});
```

**Step 3: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(FAIL|orchard cycle)"
```

Expected: all new tests fail.

**Step 4: Replace the harvest() action**

Replace the entire `harvest:` action in `src/store/gameStore.ts` with:

```ts
harvest: (plotId) => {
  const state = get();
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot || plot.state !== "ready") return;

  const coordKey = `${plot.tileCoord.col}_${plot.tileCoord.row}`;
  const isOrchard = state.tileCategories[coordKey] === "orchard";

  // Determine which dilemma to show (null = no dilemma this harvest)
  let dilemmaToShow: Dilemma | null = null;
  if (isOrchard) {
    if (plot.harvestCount < 3) {
      dilemmaToShow = ORLAH_DILEMMA;
    } else if (plot.harvestCount === 3) {
      dilemmaToShow = NETA_REVAI_DILEMMA;
    }
    // harvestCount >= 4: no dilemma
  } else {
    dilemmaToShow = PEAH_DILEMMA;
  }

  // For orchards, increment harvestCount on the plot at harvest time
  const plotsUpdated = state.plots.map((p) =>
    p.id === plotId
      ? {
          ...p,
          state: "harvested" as const,
          harvestCount: isOrchard ? p.harvestCount + 1 : p.harvestCount,
        }
      : p,
  );

  // Auto-resolve PEAH for wheat/barley when a saved decision exists
  const isFieldCropHarvest =
    plot.cropType === "wheat" || plot.cropType === "barley";
  if (isFieldCropHarvest && state.activeDilemma === null) {
    const peahKey = `peah:${plot.cropType}`;
    const saved = state.savedFieldDecisions[peahKey];
    if (saved && saved.cyclesRemaining > 0) {
      const { wheat, meters } = applyDilemmaChoice(
        PEAH_DILEMMA,
        saved.choiceIndex,
        state.wheat,
        state.meters,
      );
      set({
        plots: plotsUpdated,
        wheat,
        meters,
        savedFieldDecisions: decrementSaved(
          state.savedFieldDecisions,
          peahKey,
        ),
      });
      setTimeout(() => get().resetPlot(plotId), 600);
      return;
    }
  }

  // Orchard with no dilemma (cycle 5+): update plots and proceed to gather
  if (isOrchard && dilemmaToShow === null) {
    set({ plots: plotsUpdated });
    setTimeout(() => get().resetPlot(plotId), 600);
    return;
  }

  set((s) => ({
    plots: plotsUpdated,
    activeDilemma:
      state.activeDilemma === null ? dilemmaToShow : s.activeDilemma,
    activeDilemmaContext:
      state.activeDilemma === null
        ? plot.cropType
        : s.activeDilemmaContext,
    activePlotId:
      state.activeDilemma === null ? plotId : s.activePlotId,
  }));

  setTimeout(() => get().resetPlot(plotId), 600);
},
```

Also add the `Dilemma` type import at the top of the file (it's already in `@/types`):

```ts
import type {
  CropType,
  Dilemma,        // ADD THIS
  GameState,
  // ...rest unchanged
} from "@/types";
```

**Step 5: Run tests to verify pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|orchard cycle)"
```

Expected: all new orchard cycle gating tests pass, all existing tests still pass.

**Step 6: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat(store): orchard harvest gating — ORLAH×3, NETA_REVAI on 4th, no dilemma after"
```

---

### Task 5: Update resolveDilemma() — skip gather + reset plot

**Files:**
- Modify: `src/store/gameStore.ts`
- Test: `src/store/gameStore.test.ts`

**Step 1: Write failing tests**

Add a new describe block in `src/store/gameStore.test.ts`:

```ts
describe("resolveDilemma – orchard skip-gather behavior", () => {
  it("ORLAH choice 0 resets plot to empty immediately, no grapes added", () => {
    const plotId = setupOrchardPlot(0);
    useGameStore.getState().harvest(plotId);
    // dilemma is now active
    expect(useGameStore.getState().activeDilemma?.id).toBe("orlah");

    useGameStore.getState().resolveDilemma(0); // "Leave the fruit"

    const plot = useGameStore.getState().plots.find((p) => p.id === plotId);
    expect(plot?.state).toBe("empty");
    expect(plot?.plantedAt).toBeNull();
    expect(useGameStore.getState().grapes).toBe(0);
    expect(useGameStore.getState().activePlotId).toBeNull();
    expect(useGameStore.getState().activeDilemma).toBeNull();
  });

  it("ORLAH choice 0 keeps hasBeenPlanted true (fertilize available next)", () => {
    const plotId = setupOrchardPlot(0);
    useGameStore.getState().harvest(plotId);
    useGameStore.getState().resolveDilemma(0);
    const plot = useGameStore.getState().plots.find((p) => p.id === plotId);
    expect(plot?.hasBeenPlanted).toBe(true);
  });

  it("ORLAH choice 1 does not reset plot — gather step still needed", () => {
    const plotId = setupOrchardPlot(0);
    useGameStore.getState().harvest(plotId);
    useGameStore.getState().resolveDilemma(1); // "Take half"
    const plot = useGameStore.getState().plots.find((p) => p.id === plotId);
    // plot is "harvested" still (600ms timer hasn't fired in unit test)
    expect(plot?.state).toBe("harvested");
    expect(useGameStore.getState().activePlotId).toBeNull();
  });

  it("NETA_REVAI choice 0 resets plot to empty, no grapes added", () => {
    const plotId = setupOrchardPlot(3);
    useGameStore.getState().harvest(plotId);
    expect(useGameStore.getState().activeDilemma?.id).toBe("neta_revai");

    useGameStore.getState().resolveDilemma(0); // "Save for Jerusalem"

    const plot = useGameStore.getState().plots.find((p) => p.id === plotId);
    expect(plot?.state).toBe("empty");
    expect(useGameStore.getState().grapes).toBe(0);
    expect(useGameStore.getState().activePlotId).toBeNull();
  });

  it("NETA_REVAI choice 1 does not reset plot — gather step still needed", () => {
    const plotId = setupOrchardPlot(3);
    useGameStore.getState().harvest(plotId);
    useGameStore.getState().resolveDilemma(1); // "Take the fruit"
    const plot = useGameStore.getState().plots.find((p) => p.id === plotId);
    expect(plot?.state).toBe("harvested");
  });

  it("activePlotId is cleared on every resolveDilemma call", () => {
    const plotId = setupOrchardPlot(0);
    useGameStore.getState().harvest(plotId);
    expect(useGameStore.getState().activePlotId).toBe(plotId);
    useGameStore.getState().resolveDilemma(2); // "Take all"
    expect(useGameStore.getState().activePlotId).toBeNull();
  });
});
```

**Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(skip-gather|activePlotId)"
```

Expected: all new tests fail (plot still in "harvested" state, activePlotId not cleared).

**Step 3: Replace the resolveDilemma() action**

```ts
resolveDilemma: (choiceIndex, save = false) => {
  const {
    activeDilemma,
    activeDilemmaContext,
    activePlotId,
    wheat,
    meters,
    savedFieldDecisions,
    plots,
  } = get();
  if (!activeDilemma) return;

  const choice = activeDilemma.choices[choiceIndex];
  if (!choice) return;

  const { wheat: newWheat, meters: newMeters } = applyDilemmaChoice(
    activeDilemma,
    choiceIndex,
    wheat,
    meters,
  );

  const isSaveable = SAVEABLE_DILEMMA_IDS.has(activeDilemma.id);
  const saveKey =
    isSaveable && activeDilemmaContext
      ? `${activeDilemma.id}:${activeDilemmaContext}`
      : activeDilemma.id;
  const newSavedDecisions =
    save && isSaveable && activeDilemmaContext
      ? {
          ...savedFieldDecisions,
          [saveKey]: { choiceIndex, cyclesRemaining: 5 },
        }
      : savedFieldDecisions;

  // Choice 0 for ORLAH ("Leave the fruit") and NETA_REVAI ("Save for Jerusalem"):
  // skip gather entirely — reset the triggering plot to empty (fertilize stage).
  const skipGatherAndReset =
    (activeDilemma.id === "orlah" && choiceIndex === 0) ||
    (activeDilemma.id === "neta_revai" && choiceIndex === 0);

  const updatedPlots =
    skipGatherAndReset && activePlotId
      ? plots.map((p) =>
          p.id === activePlotId
            ? { ...p, state: "empty" as const, plantedAt: null }
            : p,
        )
      : plots;

  set({
    plots: updatedPlots,
    wheat: newWheat,
    meters: newMeters,
    activeDilemma: null,
    activeDilemmaContext: null,
    activePlotId: null,
    savedFieldDecisions: newSavedDecisions,
  });
},
```

**Step 4: Run all tests**

```bash
npm test 2>&1 | tail -15
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat(store): resolveDilemma skips gather for ORLAH/NETA_REVAI choice 0"
```

---

### Task 6: Confirm tickPlot does not touch harvestCount

**Files:**
- Test: `src/game/gameTick.test.ts`

`tickPlot` only modifies `state`, `plantedAt`, and `nextActionAt`. This test is a regression guard.

**Step 1: Add the test**

In `src/game/gameTick.test.ts`, add inside the existing `tickPlot` describe block:

```ts
it("does not modify harvestCount", () => {
  const plot: Plot = {
    id: "2_2_0",
    state: "growing",
    plantedAt: Date.now() - 5_000,
    growthDuration: 10_000,
    tileCoord: { col: 2, row: 2 },
    cropType: "grapes",
    hasBeenPlanted: true,
    nextActionAt: null,
    harvestCount: 7,
  };
  const result = tickPlot(plot, Date.now());
  expect(result.harvestCount).toBe(7);
});
```

**Step 2: Run the test**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A2 "harvestCount"
```

Expected: passes immediately (tickPlot spreads the full plot object and only overrides specific fields).

**Step 3: Commit**

```bash
git add src/game/gameTick.test.ts
git commit -m "test(gameTick): assert tickPlot preserves harvestCount"
```

---

### Task 7: Full test run + update docs

**Step 1: Run full test suite**

```bash
npm test 2>&1 | tail -5
```

Expected: all tests pass. Note the new total count.

**Step 2: Run Playwright E2E**

```bash
npx playwright test 2>&1 | tail -10
```

Expected: all 6 E2E tests pass (no regressions from store changes).

**Step 3: Update CLAUDE.md**

In `CLAUDE.md`, update:
- **Source Structure → store/gameStore.ts** — mention `activePlotId`
- **Dilemma Routing** table — add Neta Revai row
- **Key Implementation Decisions** — add persist version 11 note + harvestCount note

**Step 4: Update MEMORY.md**

In `.claude/projects/-home-gerst-projects-eve/memory/MEMORY.md`:
- Add `activePlotId: string | null` to GameState description
- Add `harvestCount: number` to Plot description
- Add Neta Revai to dilemma routing summary
- Update test count
- Note persist v11 migration

**Step 5: Append CHANGELOG entry**

```bash
# Append to CHANGELOG.md (use Edit tool, not echo)
```

Format:
```md
## 2026-02-22 — Orchard Dilemma Rework (Orlah Cycles + Neta Revai)

- Orlah now triggers for all orchard tile types (tileCategories check instead of cropType check)
- `harvestCount: number` added to `Plot`; increments each harvest regardless of choice
- ORLAH choice 0 ("Leave the fruit") skips gather: plot resets to empty (fertilize next), no yield
- Neta Revai dilemma (נטע רבעי) added for cycle 4 (harvestCount === 3): save for Jerusalem (no yield, faithfulness +8) or take fruit (full yield, morality −8)
- Cycle 5+ harvests on orchard plots: no dilemma, full yield
- `activePlotId: string | null` added to GameState for dilemma-triggered plot reset in resolveDilemma
- Persist bumped to v11; migration backfills harvestCount: 0 and activePlotId: null
- Files: types/index.ts, game/dilemmas.ts, store/gameStore.ts, store/gameStore.test.ts, game/gameTick.test.ts
```

**Step 6: Final commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: update CLAUDE.md and CHANGELOG for orchard dilemma rework"
```
