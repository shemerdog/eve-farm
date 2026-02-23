# Map Feature: Large Pannable World Map

**Feature:** Refactor the farm view into a large, draggable world map divided into map tiles. The current 4 farm plots become the content of a single "Farm" map tile.

---

## Vision

The player sees a top-down world map they can drag to explore. Most of the world is locked/fogged at first. The initial farm district (the current 2×2 plot grid) sits in one tile on the map. Adjacent tiles are other districts: a village, a market, wilderness — each unlockable over time.

The world feels alive and expansive from day one, even when only one tile is active.

---

## Current Architecture (What We Have)

```
App.tsx
  └─ <FarmGrid>               ← 2×2 CSS grid of PlotTile
       └─ <PlotTile × 4>      ← individual farm plots
```

`GameState` holds `plots: Plot[]` (4 items) — no spatial concept of the world.

---

## Target Architecture

```
App.tsx
  └─ <WorldMap>               ← pannable canvas, tracks camera {x,y}
       └─ <MapTileView × N>   ← one per world tile, positioned by CSS transform
            ├─ (tile type: farm)  → renders <FarmDistrict> (current FarmGrid)
            ├─ (tile type: village) → placeholder/locked UI
            └─ (tile type: wilderness) → placeholder/locked UI
```

Camera offset is stored in Zustand (persisted). Tiles are absolutely positioned relative to a world origin.

---

## New Type Definitions (`src/types/index.ts` additions)

```typescript
// World coordinate (in tile units, not pixels)
export type TileCoord = { col: number; row: number }

export type MapTileType =
    | 'farm' // playable farm district (current 4 plots)
    | 'village' // future: NPCs, trades
    | 'market' // future: selling wheat
    | 'wilderness' // future: gathering
    | 'locked' // not yet unlocked, shows fog

export type MapTile = {
    id: string // e.g. "0,0"
    coord: TileCoord
    type: MapTileType
    unlocked: boolean
    label: string // display name shown on tile
}

export type CameraState = {
    x: number // pixel offset from world origin
    y: number // pixel offset from world origin
}
```

Add to `GameState`:

```typescript
export type GameState = {
    // ... existing fields ...
    worldMap: MapTile[]
    camera: CameraState
}
```

---

## World Map Layout (Initial 5×5 Grid)

```
  col: -2    -1     0      1      2
row -2: [  ]  [  ]  [  ]  [  ]  [  ]
row -1: [  ]  [🌫]  [🌫]  [🌫]  [  ]
row  0: [  ]  [🌫] [🌾]  [🌫]  [  ]    ← (0,0) = Farm (active)
row  1: [  ]  [🌫]  [🌫]  [🌫]  [  ]
row  2: [  ]  [  ]  [  ]  [  ]  [  ]
```

Only (0,0) "Farm District" is unlocked at POC stage.
Adjacent 8 tiles are `locked` type with fog-of-war effect.
Outer ring is deep-locked / off-screen placeholder.

Initial camera centers on (0,0).

---

## Tile Sizing & Camera Math

- **Tile size:** `TILE_SIZE_PX = 320` — each map tile is 320×320 CSS pixels
- **Tile gap:** `TILE_GAP_PX = 8` — small gutter between tiles
- **Tile stride:** `TILE_STRIDE = TILE_SIZE_PX + TILE_GAP_PX = 328`

Pixel position of a tile at `(col, row)`:

```
left = col * TILE_STRIDE
top  = row * TILE_STRIDE
```

Camera offset centers the viewport on world origin (0,0):

```
initialCamera = {
  x: viewportWidth  / 2 - TILE_SIZE_PX / 2,
  y: viewportHeight / 2 - TILE_SIZE_PX / 2,
}
```

Tile CSS transform:

```css
transform: translate(
    calc(var(--camera-x) + var(--tile-col) * 328px),
    calc(var(--camera-y) + var(--tile-row) * 328px)
);
```

---

## Panning Mechanics

### Input handling (touch + mouse)

- **Touch:** `touchstart` / `touchmove` / `touchend` on the WorldMap container
- **Mouse:** `mousedown` / `mousemove` / `mouseup`
- **Both:** Track delta from drag start, apply to camera `{x, y}`

### Momentum / inertia (optional, polish pass)

- Track velocity (Δx/Δy per frame) on release
- Apply exponential decay: `velocity *= 0.85` per frame via `requestAnimationFrame`
- Stop when `|velocity| < 0.5`

### Bounds clamping

- Keep the world within a comfortable range so the player can't drag into the void
- `clampCamera(x, y, worldBounds)` → pure function, testable

### State persistence

- Camera `{x, y}` is persisted via Zustand `persist` so pan position survives refresh

---

## Store Changes (`src/store/gameStore.ts`)

New initial state additions:

```typescript
worldMap: INITIAL_WORLD_MAP,  // imported from src/game/worldMap.ts
camera: { x: 0, y: 0 },      // initialized in useWorldMap hook based on viewport
```

New actions:

```typescript
panCamera: (dx: number, dy: number) => void
// set((s) => ({ camera: { x: s.camera.x + dx, y: s.camera.y + dy } }))

setCameraPosition: (x: number, y: number) => void
// for snapping to a tile, or initial centering

unlockTile: (id: string) => void
// set unlocked: true on a MapTile — for future progression
```

---

## New Files to Create

### `src/game/worldMap.ts`

- `TILE_SIZE_PX`, `TILE_GAP_PX`, `TILE_STRIDE` constants
- `INITIAL_WORLD_MAP: MapTile[]` — the 5×5 grid definition
- `getTilePosition(tile: MapTile): { left: number; top: number }` — pixel coords
- `clampCamera(x, y, min, max): CameraState` — pure, testable

### `src/hooks/useWorldMap.ts`

- Initializes camera to center on (0,0) based on `window.innerWidth/Height`
- Handles drag events (touch + mouse) and calls `panCamera`
- Handles momentum decay via `requestAnimationFrame`
- Returns `{ containerRef, isDragging }` for the WorldMap component

### `src/components/WorldMap/`

- `WorldMap.tsx` — the draggable outer container; attaches drag listeners via `useWorldMap`
- `WorldMap.module.css` — `overflow: hidden`, `cursor: grab/grabbing`, `position: relative`

### `src/components/MapTileView/`

- `MapTileView.tsx` — renders one tile based on its `MapTileType`
    - `farm` → `<FarmDistrict />` (renamed from FarmGrid, same internals)
    - `locked` → fog overlay with lock icon + tile label
    - others → placeholder with label + "Coming Soon"
- `MapTileView.module.css` — absolute positioning, tile size, border-radius, transitions

### `src/components/FarmDistrict/`

- Rename/move `FarmGrid` → `FarmDistrict` (same internal code, new name fits world context)
- No behavior changes to plots, PlotTile stays identical

---

## Files to Modify

| File                          | Change                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/types/index.ts`          | Add `TileCoord`, `MapTileType`, `MapTile`, `CameraState`; extend `GameState`                       |
| `src/store/gameStore.ts`      | Add `worldMap`, `camera` initial state; add `panCamera`, `setCameraPosition`, `unlockTile` actions |
| `src/game/constants.ts`       | Add `TILE_SIZE_PX`, `TILE_GAP_PX`, `TILE_STRIDE`                                                   |
| `src/App.tsx`                 | Replace `<FarmGrid>` with `<WorldMap>` as the main content area                                    |
| `src/App.module.css`          | Remove fixed `.farm` padding/centering — WorldMap fills remaining space                            |
| `src/components/FarmGrid.tsx` | Rename to `FarmDistrict.tsx` (optional, keeps same logic)                                          |

---

## Visual Design Notes

**Overall Aesthetic:** Top-down satellite view, warm parchment-map aesthetic. Tiles have visible borders like parcels on an old land registry. The locked tiles use a linen-texture fog with a subtle ✡ watermark or just soft mist.

**Tile Appearance:**

- Farm tile: soil-brown background, same as current; 2×2 plot grid fills it
- Locked tiles: desaturated, `opacity: 0.5`, foggy gradient overlay, padlock icon
- Tile border: `2px solid rgba(0,0,0,0.15)` with a slight drop shadow

**Drag Feel:**

- `cursor: grab` normally, `cursor: grabbing` while dragging
- Slight `scale(0.98)` on the world container while dragging (gives "physical" feel)
- Fast response — no artificial smoothing on drag delta (smoothing only on inertia release)

**HUD (unchanged):**

- `MetersBar` stays at top (above the map)
- `WheatCounter` stays at bottom (below the map)
- These are outside WorldMap, still fixed in App layout

---

## Implementation Order

1. **Types** — Add all new types to `src/types/index.ts`
2. **Constants** — Add tile size constants to `src/game/constants.ts`
3. **World data** — Create `src/game/worldMap.ts` with initial map and helper functions
4. **Store** — Extend `gameStore.ts` with camera state and world map
5. **useWorldMap hook** — Implement drag/pan with touch and mouse support
6. **WorldMap component** — Container with overflow hidden, drag event handling
7. **MapTileView component** — Tile renderer dispatching by type
8. **FarmDistrict rename** — Move FarmGrid → FarmDistrict (optional cosmetic rename)
9. **App.tsx wiring** — Replace farm section with `<WorldMap>`
10. **Polish** — Momentum inertia, tile unlock animations, fog-of-war effect

---

## What Does NOT Change

- `PlotTile` component — zero changes
- `gameTick.ts` pure logic — zero changes
- `gameTick.test.ts` — zero changes
- `dilemmas.ts` — zero changes
- `useGameLoop.ts` — zero changes
- `MetersBar`, `WheatCounter`, `DilemmaModal` — zero changes
- The 4-plot farm loop — identical behavior, just now inside one map tile

---

## Success Criteria

- [ ] Player can drag the map in any direction smoothly (60fps)
- [ ] The 4 farm plots are playable inside the farm tile (full existing loop works)
- [ ] Locked tiles are visible and clearly non-interactable
- [ ] Camera position persists across page refresh
- [ ] Touch drag works on mobile (primary platform)
- [ ] No regressions in existing tests (`npm test` passes)
- [ ] Farm tile visually centers on initial load

---

## Out of Scope (Future Backlog)

- Unlocking adjacent tiles through gameplay progression
- Different crop types per tile
- Village/market tile gameplay
- Zoom in/out (pinch gesture)
- Animated tile transitions on unlock
- Mini-map overview widget
