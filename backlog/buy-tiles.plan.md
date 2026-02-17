# Buy Tiles Feature: Expanding the World Map

**Depends on:** `map-feature.plan.md` (map must be implemented first)

**Feature:** Players spend wheat to unlock adjacent map tiles. Each purchase increases the price of the next tile — exponential growth encourages meaningful decisions about where to expand.

---

## Vision

A "Buy Land" button (or tap-to-purchase UI) appears on locked tiles adjacent to any unlocked tile. The cost is shown clearly on the tile. After purchase, the tile animates open (fog dissolves) and becomes accessible. The price for the next tile is higher, visible in the shop or on the tile itself.

This creates the classic Township-style land expansion loop: farm → earn wheat → buy land → farm more.

---

## Pricing Model

### Formula

```
price(n) = BASE_TILE_PRICE * TILE_PRICE_MULTIPLIER ^ n
```

Where:
- `n` = number of tiles already purchased (starts at 0 for the first buy)
- `BASE_TILE_PRICE = 50` wheat
- `TILE_PRICE_MULTIPLIER = 1.6`

| Purchase # | Price (raw) | Price (floored) |
|-----------|-------------|-----------------|
| 1st tile  | 50          | 50              |
| 2nd tile  | 80          | 80              |
| 3rd tile  | 128         | 128             |
| 4th tile  | 204.8       | 204             |
| 5th tile  | 327.68      | 327             |
| 6th tile  | 524.29      | 524             |
| 7th tile  | 838.86      | 838             |
| 8th tile  | 1342.18     | 1342            |

Cost always floors (consistent with `applyWheatCost` convention — generous to player).

### Constants (add to `src/game/constants.ts`)

```typescript
export const BASE_TILE_PRICE = 50
export const TILE_PRICE_MULTIPLIER = 1.6

export const calcTilePrice = (tilesPurchased: number): number =>
  Math.floor(BASE_TILE_PRICE * Math.pow(TILE_PRICE_MULTIPLIER, tilesPurchased))
```

---

## State Changes

### New field on `GameState`

```typescript
tilesPurchased: number  // count of bought tiles, drives price formula
```

Initialize to `0`.

This single counter is all we need — price is always derived, never stored.

### Extended `MapTile` type (from map-feature plan)

No changes needed. `unlocked: boolean` already exists on `MapTile`. Purchasing sets it to `true`.

---

## Store Action

```typescript
buyTile: (tileId: string) => void
```

Implementation:

```typescript
buyTile: (tileId) =>
  set((s) => {
    const price = calcTilePrice(s.tilesPurchased)
    if (s.wheat < price) return s  // can't afford — no-op

    return {
      wheat: s.wheat - price,
      tilesPurchased: s.tilesPurchased + 1,
      worldMap: s.worldMap.map((t) =>
        t.id === tileId ? { ...t, unlocked: true } : t
      ),
    }
  }),
```

---

## Purchasability Rules

A tile is **purchasable** if ALL of the following are true:
1. `tile.unlocked === false`
2. At least one orthogonally adjacent tile is `unlocked`
3. The player has enough wheat (`wheat >= calcTilePrice(tilesPurchased)`)

A tile is **visible but too expensive** if rules 1 & 2 are true but 3 is false.

Helper (pure, in `src/game/worldMap.ts`):

```typescript
export const isPurchasable = (
  tile: MapTile,
  worldMap: MapTile[],
): boolean => {
  if (tile.unlocked) return false
  return worldMap.some(
    (t) =>
      t.unlocked &&
      Math.abs(t.coord.col - tile.coord.col) +
        Math.abs(t.coord.row - tile.coord.row) === 1
  )
}
```

This is an orthogonal adjacency check (Manhattan distance = 1).

---

## UI Changes

### On locked `MapTileView`

Locked tiles that are purchasable show:
```
┌─────────────────────────────────┐
│  🌫️  fog overlay (reduced)      │
│                                 │
│     [ 🌾 80 ]  ← price badge   │
│     [ Buy Land ]  ← button      │
│                                 │
│  Village                        │  ← tile label
└─────────────────────────────────┘
```

Locked tiles with no adjacent unlocked tile show:
```
┌─────────────────────────────────┐
│  🌫️  full fog overlay           │
│                                 │
│       🔒                        │
│                                 │
└─────────────────────────────────┘
```

### Affordability State

- **Can afford:** "Buy Land" button is active, price badge has normal color
- **Too expensive:** "Buy Land" button is grayed out / disabled, price badge has red tint
- **Not adjacent:** No button shown, full fog

### Price Badge

```tsx
<div className={styles.priceBadge}>
  🌾 {calcTilePrice(tilesPurchased)}
</div>
```

Position: centered on the tile, above the button.

---

## Unlock Animation

When a tile is purchased:
1. Fog overlay fades out: `opacity: 1 → 0` over `600ms`
2. Tile content fades in: `opacity: 0 → 1` over `400ms` (delayed 300ms)
3. Subtle scale: tile scales from `0.95 → 1.0` during reveal
4. Optional: brief golden glow on tile border (`box-shadow` flash)

Implementation: CSS class `.unlocking` toggled after `buyTile` dispatches. Remove class after animation ends via `onAnimationEnd`.

---

## HUD: Wheat Affordability Hint

When the player is close to affording a tile (wheat ≥ 70% of next price), add a subtle indicator to `WheatCounter`:

```
🌾 72  →  next tile: 80  (show when wheat ≥ 56)
```

This gives the player a goal to work toward without being intrusive.

---

## New Files

### None required beyond existing plan additions

All changes fit into:
- `src/game/constants.ts` — new price constants + `calcTilePrice`
- `src/game/worldMap.ts` — `isPurchasable` helper
- `src/store/gameStore.ts` — `tilesPurchased` state + `buyTile` action
- `src/types/index.ts` — `tilesPurchased: number` on `GameState`
- `src/components/MapTileView/` — buy button + price badge UI
- `src/components/WheatCounter/` — optional affordability hint

---

## Files to Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `tilesPurchased: number` to `GameState` |
| `src/game/constants.ts` | Add `BASE_TILE_PRICE`, `TILE_PRICE_MULTIPLIER`, `calcTilePrice` |
| `src/game/worldMap.ts` | Add `isPurchasable(tile, worldMap)` helper |
| `src/store/gameStore.ts` | Add `tilesPurchased: 0` initial state; add `buyTile` action |
| `src/components/MapTileView/MapTileView.tsx` | Show price badge + buy button on purchasable locked tiles |
| `src/components/MapTileView/MapTileView.module.css` | Price badge, buy button, fog variants, unlock animation |
| `src/components/WheatCounter/WheatCounter.tsx` | Optional: affordability hint when wheat ≥ 70% of next price |

---

## Unit Tests to Add (`src/game/worldMap.test.ts`)

```typescript
describe('calcTilePrice', () => {
  it('returns base price for first tile', () => expect(calcTilePrice(0)).toBe(50))
  it('applies multiplier for subsequent tiles', () => expect(calcTilePrice(1)).toBe(80))
  it('always floors fractional prices', () => expect(calcTilePrice(3)).toBe(204))
})

describe('isPurchasable', () => {
  it('returns false for unlocked tile', ...)
  it('returns false if no adjacent tile is unlocked', ...)
  it('returns true if orthogonally adjacent tile is unlocked', ...)
  it('returns false for diagonal-only adjacency', ...)
})
```

---

## Implementation Order

1. **Constants** — Add `BASE_TILE_PRICE`, `TILE_PRICE_MULTIPLIER`, `calcTilePrice` to `constants.ts`
2. **Types** — Add `tilesPurchased` to `GameState`
3. **Pure helpers** — Add `isPurchasable` to `worldMap.ts`
4. **Unit tests** — Write tests for `calcTilePrice` and `isPurchasable`
5. **Store** — Add `tilesPurchased` initial state and `buyTile` action
6. **MapTileView UI** — Add price badge, buy button, fog variants
7. **Unlock animation** — CSS `.unlocking` class + `onAnimationEnd` cleanup
8. **WheatCounter hint** — Optional affordability signal

---

## What Does NOT Change

- Farm loop (plant → grow → harvest → dilemma) — zero changes
- Dilemma system — zero changes
- Existing `PlotTile` — zero changes
- `gameTick.ts` — zero changes
- `MetersBar`, `DilemmaModal` — zero changes

---

## Success Criteria

- [ ] First tile costs exactly 50 wheat
- [ ] Each successive tile purchase increases price by ×1.6 (floored)
- [ ] Player cannot buy a tile they can't afford (button disabled)
- [ ] Player cannot buy a non-adjacent tile
- [ ] Purchased tile unlocks with a smooth animation
- [ ] `tilesPurchased` persists across refresh (Zustand persist)
- [ ] `isPurchasable` and `calcTilePrice` have passing unit tests
- [ ] WheatCounter shows affordability hint near the next price threshold

---

## Out of Scope (Future Backlog)

- Different tile types having different base prices
- Sale events or discount mechanics
- Reselling / abandoning purchased tiles
- Tile unlock requirements beyond wheat cost (e.g., meter thresholds)
- Animated coins/wheat flying from HUD to tile on purchase
