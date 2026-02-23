# Standing Decisions Feature: Household Traditions (מִנְהָג)

**Feature:** Let players store a choice for recurring dilemmas. When the same dilemma fires again, it auto-resolves using the saved choice — no modal interruption. Framed culturally as establishing a household _minhag_ (מִנְהָג — custom/tradition).

---

## Vision

In Jewish tradition, a household _minhag_ is a recurring practice a family establishes: how they observe certain obligations, year after year. This mechanic translates that concept directly into gameplay. Once you decide how you always handle Peah, the farm runs with that custom unless you consciously change it.

The modal flow gains a second step: after choosing, the player is asked "Make this a household tradition?" If yes, future occurrences of that dilemma auto-resolve silently — with a brief toast confirming it ran. The player retains full control to revoke or change traditions at any time.

---

## User Flow

### First encounter (no tradition set)

```
[DilemmaModal appears — same as today]
  Player taps choice: "הַשְׁאֵר פִּנּוֹת נְדִיבוֹת"
  ↓
[Confirmation step appears in-modal]
  "Make this a household tradition?
   Future Peah dilemmas will resolve this way automatically."
  [ Set tradition ]   [ Just this once ]
  ↓
Either way → dilemma resolves, modal closes
```

### Second encounter (tradition exists)

```
[Harvest triggers Peah dilemma]
  standingDecisions['peah'] exists → auto-resolve immediately
  No modal shown
  ↓
[MinhagToast appears for 3 seconds]
  "מִנְהָג הַבַּיִת — Peah: Generous corners (−3🌾)"
```

### Changing a tradition

```
[DilemmaModal appears — forced, overrides standing decision]
  Player taps "Override this time" to see the modal
  OR accesses Traditions panel from HUD
  → can change or revoke the stored tradition
```

---

## State Changes

### New type: `StandingDecision`

```typescript
// src/types/index.ts
export type StandingDecision = {
    dilemmaId: string
    choiceIndex: number
    choiceLabel: string // snapshot of label text at time of setting
    setAt: number // timestamp — display "set 3 days ago" in traditions panel
}
```

### New field on `GameState`

```typescript
standingDecisions: Record<string, StandingDecision>
// keyed by dilemma.id, e.g. 'peah', 'maaser'

lastAutoResolution: {
  dilemmaTitle: string
  choiceLabel: string
  wheatCost: number
} | null
// set when auto-resolve fires, cleared after toast display
```

Initialize both to:

```typescript
standingDecisions: {},
lastAutoResolution: null,
```

### Persistence

Both fields added to the `partialize` list in `gameStore.ts` so they survive page refresh.

---

## Modified Store Action: `harvest`

The key change is inside the existing `harvest` action, at the point where `shouldTrigger` is true.

**Current logic (simplified):**

```typescript
if (shouldTrigger) {
  set({ activeDilemma: DILEMMAS[...], dilemmaIndex: ... })
}
```

**New logic:**

```typescript
if (shouldTrigger) {
  const dilemma = DILEMMAS[s.dilemmaIndex % DILEMMAS.length]
  const standing = s.standingDecisions[dilemma.id]

  if (standing) {
    // Auto-resolve using stored choice
    const choice = dilemma.choices[standing.choiceIndex]
    const newWheat = Math.max(0, applyWheatCost(s.wheat + WHEAT_PER_HARVEST, choice.wheatCost))
    const newMeters = applyMeterEffects(s.meters, choice.meterEffect)
    set({
      wheat: newWheat,
      meters: newMeters,
      harvestsSinceLastDilemma: 0,
      dilemmaIndex: s.dilemmaIndex + 1,
      lastAutoResolution: {
        dilemmaTitle: dilemma.title,
        choiceLabel: choice.label,
        wheatCost: choice.wheatCost,
      },
    })
  } else {
    // Show modal as before
    set({ activeDilemma: dilemma, dilemmaIndex: s.dilemmaIndex + 1, ... })
  }
}
```

Note: Extract the meter-update logic into a pure helper `applyMeterEffects(meters, effect)` in `constants.ts` — it's currently duplicated across `harvest` and `resolveDilemma` anyway. This refactor is a small improvement that enables the auto-resolve path.

---

## New Store Actions

```typescript
setStandingDecision: (dilemmaId: string, choiceIndex: number, choiceLabel: string) => void
// set((s) => ({
//   standingDecisions: {
//     ...s.standingDecisions,
//     [dilemmaId]: { dilemmaId, choiceIndex, choiceLabel, setAt: Date.now() },
//   },
// }))

clearStandingDecision: (dilemmaId: string) => void
// set((s) => {
//   const next = { ...s.standingDecisions }
//   delete next[dilemmaId]
//   return { standingDecisions: next }
// })

clearAutoResolution: () => void
// set({ lastAutoResolution: null })
```

---

## DilemmaModal Changes

### Current flow: player taps choice → modal closes

### New flow: two-step inside the same modal

**Step 1 — Choice selection (same as today):**

- Three choice buttons render as before
- Player taps a button → `pendingChoiceIndex` enters local state (not yet committed)
- Modal transitions to Step 2

**Step 2 — Tradition prompt (new):**

```
┌───────────────────────────────────────────┐
│  ✓  הַשְׁאֵר פִּנּוֹת נְדִיבוֹת          │  ← echo the chosen option
│     (−3 🌾 · מוּסָרִיּוּת +10)            │
│                                           │
│  הַפֹּךְ זֹאת לְמִנְהַג בַּיִת?         │
│  "Make this a household tradition?"       │
│                                           │
│  [ 📌 Set tradition ]  [ Just this once ] │
└───────────────────────────────────────────┘
```

Both buttons call `resolveDilemma(pendingChoiceIndex)`.
"Set tradition" also calls `setStandingDecision(dilemma.id, pendingChoiceIndex, choice.label)`.

### When a tradition already exists

If `standingDecisions[dilemma.id]` exists when the modal appears (player forced it via "Override"), Step 2 shows:

```
┌───────────────────────────────────────────┐
│  ...                                      │
│  הַחְלֵף אֶת הַמִּנְהָג?                │
│  "Update household tradition?"            │
│                                           │
│  [ 📌 Update ]  [ Just this once ]  [ 🗑 Remove tradition ] │
└───────────────────────────────────────────┘
```

"Remove tradition" calls `clearStandingDecision(dilemma.id)` + `resolveDilemma(pendingChoiceIndex)`.

### Step 2 animation

Slide the Step 2 panel up from the bottom of the modal with a `transform: translateY(100%) → 0` over 250ms. Step 1 choices slide up and out.

---

## New Component: `MinhagToast`

**Location:** `src/components/MinhagToast/`

**Behavior:**

- Watches `lastAutoResolution` in the store
- When it becomes non-null, renders a toast for 3 seconds, then calls `clearAutoResolution()`
- Does not block interaction — positioned above `WheatCounter`, below the farm

**Visual:**

```
┌────────────────────────────────────────────┐
│  מִנְהָג הַבַּיִת  ·  Peah                 │
│  הַשְׁאֵר פִּנּוֹת נְדִיבוֹת  (−3 🌾)    │
└────────────────────────────────────────────┘
```

- Slides in from bottom, holds 2.5s, slides out over 0.5s
- Warm golden background (`var(--color-ready)` tint), small text, RTL
- Does not stack — if two auto-resolutions fire back to back (edge case), queue them

---

## New Component: `TraditionsPanel` (optional, Phase 2)

A scrollable sheet or modal accessible from a small "📜 Traditions" icon in the HUD.

Lists all set traditions:

```
📌  פֵּאָה — הַשְׁאֵר פִּנּוֹת נְדִיבוֹת   [Revoke]
📌  מַעֲשֵׂר — מַעֲשֵׂר שָׁלֵם              [Revoke]
```

Each revoke calls `clearStandingDecision(id)`.

Can be deferred to a follow-up PR — the core feature works without it since users can change traditions through the DilemmaModal override path.

---

## Override Mechanism

Players always retain control. Two paths to override:

1. **HUD button** (if `TraditionsPanel` is built): tap 📜, revoke, done
2. **Forced modal** (simpler, works without TraditionsPanel): long-press on any ready plot → "Show next dilemma manually?" prompt. Or a dedicated "Override traditions" button visible in the HUD when any traditions are active.

For the minimal implementation: add a subtle "⚙ Traditions" link in the `WheatCounter` HUD area. Tapping it opens an inline drawer listing active traditions with revoke buttons.

---

## Pure Helper Extraction

Currently `resolveDilemma` and the new auto-resolve path both compute meter effects. Extract into:

```typescript
// src/game/constants.ts
export const applyMeterEffects = (
    current: MeterValues,
    effect: Partial<MeterValues>,
): MeterValues => ({
    devotion: clampMeter(current.devotion + (effect.devotion ?? 0)),
    morality: clampMeter(current.morality + (effect.morality ?? 0)),
    faithfulness: clampMeter(current.faithfulness + (effect.faithfulness ?? 0)),
})
```

This is a pure function, add tests to `gameTick.test.ts` (or a new `constants.test.ts`).

---

## Files to Create

| File                                                | Purpose                      |
| --------------------------------------------------- | ---------------------------- |
| `src/components/MinhagToast/MinhagToast.tsx`        | Auto-resolution notification |
| `src/components/MinhagToast/MinhagToast.module.css` | Toast slide animation        |

---

## Files to Modify

| File                                                  | Change                                                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/types/index.ts`                                  | Add `StandingDecision` type; add `standingDecisions`, `lastAutoResolution` to `GameState`                                                                          |
| `src/game/constants.ts`                               | Add `applyMeterEffects` pure helper                                                                                                                                |
| `src/store/gameStore.ts`                              | Extend initial state; modify `harvest` for auto-resolve; add `setStandingDecision`, `clearStandingDecision`, `clearAutoResolution`; add new fields to `partialize` |
| `src/components/DilemmaModal/DilemmaModal.tsx`        | Add `pendingChoiceIndex` local state; Step 2 tradition prompt UI                                                                                                   |
| `src/components/DilemmaModal/DilemmaModal.module.css` | Step 2 slide-up transition                                                                                                                                         |
| `src/App.tsx`                                         | Mount `<MinhagToast />`                                                                                                                                            |

---

## Unit Tests to Add

```typescript
// src/game/constants.test.ts
describe('applyMeterEffects', () => {
  it('applies positive effects', ...)
  it('applies negative effects', ...)
  it('clamps to 0 minimum', ...)
  it('clamps to 100 maximum', ...)
  it('leaves unspecified meters unchanged', ...)
})

// src/store/gameStore.test.ts (or integration test)
describe('standing decisions', () => {
  it('auto-resolves dilemma when standing decision exists', ...)
  it('shows modal when no standing decision exists', ...)
  it('sets lastAutoResolution when auto-resolving', ...)
  it('increments dilemmaIndex on auto-resolve', ...)
  it('deducts wheat correctly on auto-resolve', ...)
  it('clearStandingDecision removes the entry', ...)
})
```

---

## Implementation Order

1. **Types** — Add `StandingDecision`, `lastAutoResolution` to `src/types/index.ts`
2. **Pure helper** — Extract `applyMeterEffects` into `constants.ts`, add tests
3. **Store** — New initial state fields, modify `harvest`, add three new actions, extend `partialize`
4. **DilemmaModal** — Add `pendingChoiceIndex` local state, wire two-step flow, tradition prompt UI
5. **MinhagToast** — New component, mount in `App.tsx`
6. **TraditionsPanel** _(optional Phase 2)_ — Revoke UI accessible from HUD

---

## What Does NOT Change

- `PlotTile` — zero changes
- `gameTick.ts` — zero changes
- `gameTick.test.ts` — zero changes (tests still pass)
- `useGameLoop.ts` — zero changes
- `MetersBar`, `FarmGrid`, `WheatCounter` — zero changes (WheatCounter only gains an optional small "Traditions" link)
- `DILEMMAS` array in `dilemmas.ts` — zero changes
- The existing `resolveDilemma` action — called as before from the modal, untouched signature

---

## Success Criteria

- [ ] First occurrence of a dilemma always shows the modal
- [ ] After "Set tradition", subsequent occurrences of the same dilemma auto-resolve (no modal)
- [ ] Auto-resolution applies wheat cost and meter effects identically to manual resolution
- [ ] `MinhagToast` appears after each auto-resolution and dismisses after 3 seconds
- [ ] Player can revoke a tradition and return to manual modal flow
- [ ] Player can update a tradition by choosing differently and tapping "Update"
- [ ] `standingDecisions` persists across page refresh
- [ ] `lastAutoResolution` does NOT persist (clears on reload — transient notification state)
- [ ] All new unit tests pass, existing 11 tests still pass

---

## Out of Scope (Future Backlog)

- Traditions that apply across multiple dilemma types (a "blanket generosity" setting)
- Temporary traditions ("do this for the next 5 harvests only")
- Notifications about tradition effectiveness (meter trends over time)
- Traditions tied to meter thresholds ("only tithe when morality > 70")
- Export/share your household traditions
