# Code Style: Enums + Naming Cleanup

## Objective

Convert all string union types to TypeScript string enums (values change to PascalCase,
requiring a persist migration). Rename FarmTileContent → WheatTileContent, WheatCounter →
CropsCounter, and TileType.Farm → TileType.Wheat for explicitness. Persist version: 15 → 16.

---

## Decisions (already confirmed with user)

| Question | Decision |
|---|---|
| Enum style | TypeScript `enum` with PascalCase string values (Option A) |
| `FarmGrid` rename | Leave as-is — it's a generic grid used by all tile types |
| `TileType.farm` | Rename to `TileType.Wheat = 'Wheat'` — be explicit |
| `BuildingSlot.state` inline union | Leave as-is — 2 values, rarely used, rule of 3 not reached |
| Local `Step` type in LockedTileContent | Leave local |
| `TileSubcategory` overlap | Deferred — see Phase 5 note below |
| Persist value changes | Yes — enum values change; v16 migration required |

---

## Enums to Define

All defined in `src/types/index.ts`, replacing the current `type X = '...' | '...'` unions.

### `PlotState`
```ts
export enum PlotState {
    Empty      = 'Empty',
    Plowed     = 'Plowed',
    Planted    = 'Planted',
    Fertilized = 'Fertilized',
    Tended     = 'Tended',
    Growing    = 'Growing',
    Ready      = 'Ready',
    Harvested  = 'Harvested',
    Gathered   = 'Gathered',
}
```

### `CropType`
```ts
export enum CropType {
    Wheat  = 'Wheat',
    Barley = 'Barley',
    Grapes = 'Grapes',
}
```

### `TileCategory`
```ts
export enum TileCategory {
    Field     = 'Field',
    Orchard   = 'Orchard',
    Structure = 'Structure',
}
```

### `TileSubcategory`
```ts
export enum TileSubcategory {
    Wheat     = 'Wheat',
    Barley    = 'Barley',
    Grapes    = 'Grapes',
    Structure = 'Structure',
}
```
> Note: TileSubcategory structural redesign is deferred to Phase 5. For now it gets PascalCase
> values only, no structural change.

### `BuildingType`
```ts
export enum BuildingType {
    Farmhouse  = 'Farmhouse',
    Barn       = 'Barn',
    Sheepfold  = 'Sheepfold',
    Silo       = 'Silo',
}
```

### `TileType`
```ts
export enum TileType {
    Wheat  = 'Wheat',   // was 'farm' — renamed for explicitness
    Locked = 'Locked',
}
```
> Note: TileType is NOT persisted (TILES array is static). No migration needed for this enum.

---

## Phase 1 — Type Definitions (`src/types/index.ts`)

Replace all 6 string union types with string enums as above.

`BuildingSlot.state` inline union stays: `state: 'empty' | 'built'` (unchanged).

---

## Phase 2 — Pure Game Logic Files

### `src/game/game-tick.ts`
- All `PlotState` string comparisons → `PlotState.Xxx`

### `src/game/world-map.ts`
- `TileType` string comparisons → `TileType.Wheat`, `TileType.Locked`
- `TileType = 'farm'` assignment in `buildTileGrid` → `TileType.Wheat`

### `src/game/constants.ts`
- `SELL_PRICE: Record<CropType, number>` — update keys to computed property syntax:
  ```ts
  export const SELL_PRICE: Record<CropType, number> = {
      [CropType.Wheat]:  5,
      [CropType.Barley]: 7,
      [CropType.Grapes]: 10,
  }
  ```

### `src/game/strings.he.ts`
- `HE.buildings` keys must match `BuildingType` values (coupled via `HE.buildings[slot.buildingType]`).
  Change keys from lowercase to PascalCase:
  ```ts
  buildings: {
      categoryLabel: 'מבנים',
      emptySlotLabel: 'בנה',
      Farmhouse: 'בית',
      Barn:      'אסם',
      Sheepfold: 'דיר',
      Silo:      'סילו',
  }
  ```
- All explicit property accesses in `BuildingSlotTile.tsx` (`HE.buildings.farmhouse` etc.)
  must be updated to `HE.buildings.Farmhouse` etc.

---

## Phase 3 — Store Files

### `src/store/game/state.ts`
- `initialState` default plot state: `PlotState.Empty`
- `makePlots` sets `cropType: CropType.Wheat` (default)

### `src/store/game/plot-actions.ts`
All PlotState string comparisons and assignments → enum values:
- `'empty'` → `PlotState.Empty`
- `'plowed'` → `PlotState.Plowed`
- `'planted'` → `PlotState.Planted`
- `'fertilized'` → `PlotState.Fertilized`
- `'tended'` → `PlotState.Tended`
- `'growing'` → `PlotState.Growing`
- `'ready'` → `PlotState.Ready`
- `'harvested'` → `PlotState.Harvested`
- `'gathered'` → `PlotState.Gathered`

### `src/store/game/dilemma-actions.ts`
- PlotState comparisons/assignments (harvest routing, gather routing, resetPlot)
- CropType comparisons (`activeDilemmaContext`)
- TileCategory comparisons (`tileCategories[key] === 'orchard'`)

### `src/store/game/economy-actions.ts`
- `TileCategory` comparisons in `buyTile` routing
- `TileSubcategory` comparisons for determining cropType
- `CropType` assignments on new plots
- `CropType` comparisons in `sellCrops`

### `src/store/game/building-actions.ts`
- `BuildingType` literals in constructBuilding/demolishBuilding (if any)

### `src/store/game/migrations.ts`
Add v16 migration block (see Phase 6 below).

---

## Phase 4 — Component Files

### `src/components/PlotTile.tsx`
All PlotState and CropType comparisons (heaviest component change):
- `p.state === 'empty'` → `p.state === PlotState.Empty` (and all 8 other states)
- `plot.cropType === 'grapes'` → `plot.cropType === CropType.Grapes`
- `plot.cropType === 'barley'` → `plot.cropType === CropType.Barley`

### `src/components/BuildingSlotTile.tsx`
- `BUILDING_TYPES` array: `type: 'farmhouse'` → `type: BuildingType.Farmhouse`, etc.
- `BUILT_EMOJI` record: keys become `[BuildingType.Farmhouse]: '🏠'`, etc.
- `slot.state === 'built'` — leave as-is (inline union, not converting)
- `HE.buildings.farmhouse` → `HE.buildings.Farmhouse`, etc. (3 explicit accesses on lines 10-13, 31)

### `src/components/WheatCounter.tsx`  ← to be renamed CropsCounter.tsx (Phase 4b)
- CropType comparisons inside sell handler

### `src/components/WorldMap/MapTileView.tsx`
- `tile.type === 'farm'` → `tile.type === TileType.Wheat`
- `tileCategories[key] ?? 'field'` → `tileCategories[key] ?? TileCategory.Field`
- `category === 'structure'` → `category === TileCategory.Structure`
- `category === 'orchard'` → `category === TileCategory.Orchard`
- `firstCropType === 'barley'` → `firstCropType === CropType.Barley`

### `src/components/WorldMap/LockedTileContent.tsx`
- `TileCategory` literals: `'field'`, `'orchard'`, `'structure'` → enum values
- `TileSubcategory` literals: `'wheat'`, `'barley'`, `'grapes'`, `'structure'` → enum values
- Local `Step` type stays as-is

---

## Phase 4b — Component Renames

### `FarmTileContent` → `WheatTileContent`
Files to rename (git mv):
- `src/components/WorldMap/FarmTileContent.tsx` → `WheatTileContent.tsx`
- `src/components/WorldMap/FarmTileContent.module.css` → `WheatTileContent.module.css`

Import updates:
- `MapTileView.tsx` line 6: `import { FarmTileContent }` → `{ WheatTileContent }`
- `MapTileView.tsx` lines 30, 50: component usage → `<WheatTileContent />`
- CSS import inside `WheatTileContent.tsx`: `FarmTileContent.module.css` → `WheatTileContent.module.css`

### `WheatCounter` → `CropsCounter`
Files to rename (git mv):
- `src/components/WheatCounter.tsx` → `CropsCounter.tsx`
- `src/components/WheatCounter.module.css` → `CropsCounter.module.css`

Import updates:
- `src/App.tsx`: import name + component usage

---

## Phase 5 — TileSubcategory Redesign (DEFERRED)

**Status: Not implementing now. Discuss before execution.**

**The problem:** `TileSubcategory = 'wheat' | 'barley' | 'grapes' | 'structure'` conflates crop
types and category types. `'grapes'` is also in `CropType`; `'structure'` mirrors `TileCategory`.

**User's direction:** subcategory should conceptually be `crops/farm | orchard | buildings`.

**Options to evaluate before implementing:**
1. `TileSubcategory = { Wheat, Barley }` — only used for field tiles; orchard/structure pass
   `null` to `onBuy`. Requires changing `buyTile(coord, category, subcategory)` signature.
2. Keep `TileSubcategory` but rename: `'grapes'` → `'Orchard'`, `'structure'` → `'Building'`.
3. Drop `TileSubcategory` entirely; derive crop type from category + a separate field-crop enum.

All 3 options require updating `LockedTileContent.tsx`, `economy-actions.ts`, and call sites.

---

## Phase 6 — Migration v16

Add v16 block to `migratePersistedGameState` in `src/store/game/migrations.ts`.

```ts
if (version < 16) {
    const plotStateMap: Record<string, string> = {
        empty: 'Empty', plowed: 'Plowed', planted: 'Planted',
        fertilized: 'Fertilized', tended: 'Tended', growing: 'Growing',
        ready: 'Ready', harvested: 'Harvested', gathered: 'Gathered',
    }
    const cropTypeMap: Record<string, string> = {
        wheat: 'Wheat', barley: 'Barley', grapes: 'Grapes',
    }
    const tileCatMap: Record<string, string> = {
        field: 'Field', orchard: 'Orchard', structure: 'Structure',
    }
    const buildingTypeMap: Record<string, string> = {
        farmhouse: 'Farmhouse', barn: 'Barn', sheepfold: 'Sheepfold', silo: 'Silo',
    }

    // Plots: state + cropType
    mapPlots(state, (plot) => ({
        ...plot,
        state:    plotStateMap[String(plot.state)]   ?? plot.state,
        cropType: cropTypeMap[String(plot.cropType)] ?? plot.cropType,
    }))

    // tileCategories values
    const cats = asRecord(state.tileCategories)
    for (const key of Object.keys(cats)) {
        cats[key] = tileCatMap[String(cats[key])] ?? cats[key]
    }
    state.tileCategories = cats

    // savedFieldDecisions keys: "peah:wheat" → "peah:Wheat"
    const oldDecisions = asRecord(state.savedFieldDecisions)
    const newDecisions: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(oldDecisions)) {
        const parts = k.split(':')
        const newKey = parts.length === 2
            ? `${parts[0]}:${cropTypeMap[parts[1]] ?? parts[1]}`
            : k
        newDecisions[newKey] = v
    }
    state.savedFieldDecisions = newDecisions

    // encounteredDilemmas array
    state.encounteredDilemmas = asArray(state.encounteredDilemmas).map((entry) => {
        const k = String(entry)
        const parts = k.split(':')
        return parts.length === 2
            ? `${parts[0]}:${cropTypeMap[parts[1]] ?? parts[1]}`
            : k
    })

    // activeDilemmaContext
    if (typeof state.activeDilemmaContext === 'string') {
        state.activeDilemmaContext =
            cropTypeMap[state.activeDilemmaContext] ?? state.activeDilemmaContext
    }

    // buildingSlots: buildingType
    state.buildingSlots = asArray(state.buildingSlots).map((slot) => {
        const s = asRecord(slot)
        if (typeof s.buildingType === 'string') {
            s.buildingType = buildingTypeMap[s.buildingType] ?? s.buildingType
        }
        return s
    })
}
```

Bump persist version in `src/store/game-store.ts`: `version: 15` → `version: 16`.

---

## Phase 7 — Tests

### `src/store/game-store.migrations.test.ts`
New tests for v16:
- Old lowercase `PlotState` values convert to PascalCase
- Old lowercase `CropType` values convert to PascalCase
- Old lowercase `TileCategory` values in `tileCategories` record convert
- Old lowercase `BuildingType` values in `buildingSlots` convert
- `savedFieldDecisions` keys `"peah:wheat"` → `"peah:Wheat"` etc.
- `encounteredDilemmas` entries updated
- Already-PascalCase values are passed through unchanged (idempotent guard)

### All other test files — mechanical string literal → enum updates:
| Test file | Types to update |
|---|---|
| `game-store.economy.test.ts` | CropType, TileCategory, TileSubcategory |
| `game-store.dilemmas.test.ts` | PlotState, CropType |
| `game-store.dilemmas.state-tracking.test.ts` | CropType |
| `game-store.orchard.lifecycle.test.ts` | PlotState |
| `game-store.orchard.cycle.test.ts` | PlotState |
| `game-store.orchard.saved-decisions.test.ts` | CropType, PlotState |
| `game-store.orchard.dilemma-gating.test.ts` | CropType, PlotState |
| `game-store.buildings.test.ts` | BuildingType, PlotState |
| `src/test-utils/game-store.ts` | PlotState, CropType |
| `PlotTile.test.tsx` | PlotState |
| `PlotTile.orchard.test.tsx` | PlotState |
| `LockedTileContent.test.tsx` | TileCategory, TileSubcategory |
| `BuildingSlotTile.test.tsx` | BuildingType |
| `BuildingGrid.test.tsx` | BuildingType (verify) |

---

## Risk Assessment

| Change | Risk | Notes |
|---|---|---|
| `PlotState` enum (9 values) | HIGH | Most widely used type; ~40+ comparison sites across 10+ files |
| `CropType` enum (3 values) | MEDIUM | Affects persisted keys in savedFieldDecisions/encounteredDilemmas |
| `TileCategory` enum (3 values) | MEDIUM | Persisted in `tileCategories` record; routing logic |
| `TileSubcategory` enum (4 values) | LOW-MEDIUM | Only LockedTileContent + economy-actions |
| `BuildingType` enum (4 values) | LOW-MEDIUM | `HE.buildings` key coupling — must change atomically |
| `TileType` enum (2 values) | LOW | Not persisted; 2 usages only |
| v16 migration | HIGH | Complex multi-field migration; test thoroughly |
| `FarmTileContent` → `WheatTileContent` rename | LOW | 1 file pair, 1 import site (MapTileView) |
| `WheatCounter` → `CropsCounter` rename | LOW | 1 file pair, 1 import site (App.tsx) |
| `HE.buildings` key case change | MEDIUM | Coupled with BuildingType values; change atomically |
| Test file updates | HIGH (volume) | ~15 test files — mechanical but many |

---

## Execution Order

Run phases in this order to keep the build green after each phase:

1. **Phase 6 (Migration)** — add v16 block + bump version (no type changes yet; tests still pass)
2. **Phase 1 (Types)** — replace unions with enums in types/index.ts (build breaks until Phase 2+)
3. **Phase 2 (Pure Game Logic)** — game-tick, world-map, constants, strings.he
4. **Phase 3 (Store)** — state, plot-actions, dilemma-actions, economy-actions, building-actions
5. **Phase 4 (Components)** — PlotTile, BuildingSlotTile, MapTileView, LockedTileContent, WheatCounter
6. **Phase 4b (Renames)** — git mv FarmTileContent→WheatTileContent, WheatCounter→CropsCounter; fix imports
7. **Phase 7 (Tests)** — update all test files; add v16 migration tests
8. **Docs** — update CLAUDE.md source listing, MEMORY.md persist version notes

After Phase 6: `npm test` passes (migration code, no type changes).
After Phase 1-5: TypeScript compiles clean, `npm test` passes.
After Phase 4b: `npm test` and `npx playwright test` pass.

---

## Verification

```bash
npm run build              # no TypeScript errors
npm test                   # all Vitest tests pass (~+10 migration tests)
npx playwright test        # E2E still passes
npm run dev                # manual: old localStorage migrates on load
```

Manual migration smoke test:
1. Load game with v15 localStorage (old lowercase values)
2. Refresh → v16 migration runs silently
3. All plots, tiles, saved decisions preserved and functional

---

## Complete File List

### Modified source files (23)
- `src/types/index.ts`
- `src/game/game-tick.ts`
- `src/game/world-map.ts`
- `src/game/constants.ts`
- `src/game/strings.he.ts`
- `src/store/game-store.ts`
- `src/store/game/state.ts`
- `src/store/game/plot-actions.ts`
- `src/store/game/dilemma-actions.ts`
- `src/store/game/economy-actions.ts`
- `src/store/game/building-actions.ts`
- `src/store/game/migrations.ts`
- `src/store/game/store-types.ts`
- `src/components/PlotTile.tsx`
- `src/components/BuildingSlotTile.tsx`
- `src/components/WorldMap/MapTileView.tsx`
- `src/components/WorldMap/LockedTileContent.tsx`
- `src/App.tsx`
- `src/test-utils/game-store.ts`

### Renamed files (4 → 4)
- `FarmTileContent.tsx` → `WheatTileContent.tsx`
- `FarmTileContent.module.css` → `WheatTileContent.module.css`
- `WheatCounter.tsx` → `CropsCounter.tsx`
- `WheatCounter.module.css` → `CropsCounter.module.css`

### Modified test files (14)
- `src/store/game-store.economy.test.ts`
- `src/store/game-store.dilemmas.test.ts`
- `src/store/game-store.dilemmas.state-tracking.test.ts`
- `src/store/game-store.orchard.lifecycle.test.ts`
- `src/store/game-store.orchard.cycle.test.ts`
- `src/store/game-store.orchard.saved-decisions.test.ts`
- `src/store/game-store.orchard.dilemma-gating.test.ts`
- `src/store/game-store.migrations.test.ts`
- `src/store/game-store.buildings.test.ts`
- `src/components/PlotTile.test.tsx`
- `src/components/PlotTile.orchard.test.tsx`
- `src/components/WorldMap/LockedTileContent.test.tsx`
- `src/components/BuildingSlotTile.test.tsx`
- `src/components/BuildingGrid.test.tsx`
