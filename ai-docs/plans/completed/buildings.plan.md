# Farm Structures / Buildings (מבנים) Implementation Plan

**Goal:** Add a new `'structure'` tile category where players can build Farmhouse, Barn, Sheep fold, or Silo in each of the 4 tile quarters independently.

## Progress Update (2026-02-25)

### Completed (Tasks 1–3)
- Task 1: Types — `BuildingType`, `BuildingSlot`, extended `TileCategory`/`TileSubcategory`, `buildingSlots` on `GameState`
- Task 2: Constants/Strings — `BUILDING_SLOT_COUNT`, `HE.buildings` Hebrew strings
- Task 3: State helpers — `makeStructureSlots`, `buildingSlots: []` in `initialState`

### Completed (Tasks 4–6 + partial Task 7)
- Task 4: `buildStructure` added to `GameActions` in `store-types.ts`
- Task 5: 10 RED→GREEN tests in `game-store.buildings.test.ts`
- Task 6: `building-actions.ts` created; `economy-actions.ts` extended for structure tile purchase
- Task 7 (partial): `buildStructure` wired into `game-store.ts` (version bump + partialize pending)

### Completed (Tasks 7–9)
- Task 7: `game-store.ts` version bumped to v14; `buildingSlots` added to `partialize`
- Task 8: v14 migration in `migrations.ts`; 2 new migration tests
- Task 9: `BuildingSlotTile` component + CSS module; 10 tests (RED→GREEN)

### Completed (Tasks 10–14)
- Task 10: `BuildingGrid` component + CSS module; 4 tests (RED→GREEN)
- Task 11: `BuildingTileContent` component (reuses FarmTileContent.module.css); 1 test
- Task 12: `MapTileView` routes `category === 'structure'` → BuildingTileContent; `LockedTileContent` gains 3rd root button (🏗️ מבנים); 2 new tests
- Task 13: 344/344 Vitest passing; `tsc -p tsconfig.app.json --noEmit` clean; pre-existing TS gaps in PlotTile.test.tsx + orchard-gating test fixed via Serena `replace_content`
- Task 14: CHANGELOG.md + CLAUDE.md + MEMORY.md updated

---

## Tasks

- [x] Task 1: Types (`src/types/index.ts`)
- [x] Task 2: Constants + Hebrew Strings (`constants.ts`, `strings.he.ts`)
- [x] Task 3: State Helpers + initialState (`state.ts`)
- [x] Task 4: Store Types (`store-types.ts`) — add `buildStructure` to `GameActions`
- [x] Task 5: Store Tests TDD — RED (`game-store.buildings.test.ts`)
- [x] Task 6: Building Actions (`building-actions.ts`, extend `economy-actions.ts`)
- [x] Task 7: Wire Store + Version Bump (`game-store.ts`, persist v14)
- [x] Task 8: Migration v14 (`migrations.ts`, migration tests)
- [x] Task 9: BuildingSlotTile Component (TDD)
- [x] Task 10: BuildingGrid Component
- [x] Task 11: BuildingTileContent Component
- [x] Task 12: MapTileView Routing + LockedTileContent Buy Flow
- [x] Task 13: Verification (tests, tsc, smoke test, Playwright)
- [x] Task 14: CHANGELOG + CLAUDE.md
