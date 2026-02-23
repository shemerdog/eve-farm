# Orchard Dilemma Redesign — Design Document

**Date:** 2026-02-22
**Status:** Approved

---

## Summary

Rework the orchard dilemma system so that:

1. Orlah applies to all orchard sub-types (not just grapes).
2. Choosing "Leave the fruit" in Orlah skips the gather step and resets the plot to the fertilize stage.
3. Orlah stops after 3 harvest cycles per plot.
4. The fourth harvest cycle shows the נטע רבעי (Neta Revai) dilemma instead.

---

## Data Model

### `Plot` — new field

```ts
harvestCount: number // 0 on creation; incremented on every harvest() call for this plot
```

`harvestCount` increments unconditionally at harvest time, regardless of which dilemma choice the player makes. The tree ages whether or not the fruit is taken (halachically correct).

### `GameState` — new field

```ts
activePlotId: string | null // set alongside activeDilemma; cleared on resolveDilemma
```

Follows the same pattern as `activeDilemmaContext`. Allows `resolveDilemma` to find the triggering plot without threading a `plotId` through the UI.

---

## Dilemma Cycle Gating

The orchard check in `harvest()` changes from `cropType === "grapes"` to:

```ts
tileCategories[`${plot.tileCoord.col}_${plot.tileCoord.row}`] === 'orchard'
```

This covers all present and future orchard sub-types.

Cycle routing per plot, keyed on `harvestCount` **before** incrementing:

| `harvestCount` (before harvest) | Dilemma shown                      |
| ------------------------------- | ---------------------------------- |
| 0, 1, 2 — cycles 1–3            | ORLAH                              |
| 3 — cycle 4                     | NETA_REVAI                         |
| ≥ 4 — cycle 5+                  | none; yield added straight through |

---

## "Leave the Fruit" — Orlah Choice 0

When `resolveDilemma` sees `activeDilemma.id === "orlah"` and `choiceIndex === 0`:

- Find the plot by `activePlotId`.
- Set it to `{ state: "empty", plantedAt: null }` — no yield added.
- `hasBeenPlanted` stays `true`, so **fertilize** is the next available action (normal subsequent-cycle start).
- Clear `activePlotId: null`.

The 600 ms `resetPlot` setTimeout already scheduled by `harvest()` is harmless: it guards on `p.state === "harvested"`, which will be `"empty"` by the time it fires, making it a no-op.

Choices 1 ("Take half") and 2 ("Take all") continue through the gather step normally — full yield.

---

## נטע רבעי Dilemma (Cycle 4)

```ts
export const NETA_REVAI_DILEMMA: Dilemma = {
    id: 'neta_revai',
    title: 'נֶטַע רְבָעִי — פְּרִי שְׁנַת הָרְבִיעִית',
    narrative:
        'הָעֵץ הִגִּיעַ לְשָׁנָתוֹ הָרְבִיעִית, וּפֵרוֹתָיו קֹדֶשׁ לַה׳. ' +
        'הַמָּסֹרֶת מְצַוָּה לְהַעֲלוֹת אֶת הַפֵּרוֹת לִירוּשָׁלַיִם ' +
        'וּלְאָכְלָם שָׁם בְּטָהֳרָה. מַה תַּעֲשֶׂה עִם הַיְּבוּל הַזֶּה?',
    choices: [
        {
            label: 'שְׁמֹר לְמַסַּע הַבָּא לִירוּשָׁלָיִם',
            description: 'אַתָּה שׁוֹמֵר אֶת הַפֵּרוֹת לִמְסִירָתָם בְּטָהֳרָה בִּירוּשָׁלָיִם',
            wheatCost: 0,
            meterEffect: { faithfulness: +8, devotion: +5 },
        },
        {
            label: 'קַח אֶת הַפֵּרוֹת לְעַצְמְךָ',
            description: 'אַתָּה לוֹקֵחַ אֶת הַפֵּרוֹת לְעַצְמְךָ בְּלִי לְהַקְדִּישָׁם',
            wheatCost: 0,
            meterEffect: { morality: -8, devotion: -5 },
        },
    ],
}
```

**Choice 0 ("Save for Jerusalem"):** No fruit added; plot resets to `{ state: "empty", plantedAt: null }` immediately (same path as Orlah "Leave the fruit"). Handled in `resolveDilemma` via `activePlotId`.

**Choice 1 ("Take for yourself"):** Full yield via normal gather step. Meter penalty applied.

---

## Store Changes (`gameStore.ts`)

1. **`harvest()`**
    - Replace `cropType === "grapes"` guard with `tileCategories` orchard check.
    - Set `activePlotId = plotId` when a dilemma fires.
    - Increment `plot.harvestCount` on every orchard harvest.
    - Route dilemma by `harvestCount`: < 3 → ORLAH, === 3 → NETA_REVAI, > 3 → no dilemma.

2. **`resolveDilemma()`**
    - After applying meter effects, check if the resolved dilemma requires a plot reset:
        - `(id === "orlah" && choiceIndex === 0)` → reset plot to empty, no yield
        - `(id === "neta_revai" && choiceIndex === 0)` → reset plot to empty, no yield
    - Clear `activePlotId: null` on every resolution.

3. **`initialState`** — add `activePlotId: null`.

4. **`partialize`** — include `activePlotId`.

---

## Persist Migration (v11)

```ts
if (version < 11) {
    state.activePlotId = state.activePlotId ?? null
    state.plots = (state.plots ?? []).map((p) => ({
        ...p,
        harvestCount: p.harvestCount ?? 0,
    }))
}
```

---

## Files Touched

| File                          | Change                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/types/index.ts`          | Add `harvestCount: number` to `Plot`; add `activePlotId: string \| null` to `GameState`                            |
| `src/game/dilemmas.ts`        | Add and export `NETA_REVAI_DILEMMA`                                                                                |
| `src/store/gameStore.ts`      | Orchard check by tileCategory; harvestCount; activePlotId; cycle gating; resolveDilemma skip-gather; v11 migration |
| `src/store/gameStore.test.ts` | Tests: ORLAH leave-fruit plot reset, cycle gating (ORLAH × 3 → NETA_REVAI → none), Neta Revai skip-yield           |
| `src/game/gameTick.test.ts`   | Confirm `harvestCount` untouched by `tickPlot`                                                                     |

---

## Out of Scope

- Partial yield for ORLAH "Take half" (remains full yield for now).
- Redemption money mechanic for Neta Revai.
- Saving Neta Revai decisions (not saveable — it appears exactly once per plot).
