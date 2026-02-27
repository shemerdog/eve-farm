# Monetary System (Shekels)

## Context

Currently, tile purchases are gated by wheat (a crop resource). The player has no distinct monetary currency — crops are both consumable resources and the only "money." This makes the economy shallow: you hoard wheat instead of farming it, and there's no natural way to convert farming output into progression.

The goal is to add **shekels (₪)** as a proper monetary layer: players start with 5,000₪, earn more by selling crops, and spend it to expand their farm (tile purchases). Dilemma wheat costs stay unchanged — crops remain morally meaningful resources, not just fungible currency.

## Design

- `shekels: number` on `GameState` — initial value 5,000
- Tile purchases deduct shekels (no longer wheat)
- New `sellCrops(cropType)` action — sells in bulk of 10 for shekels: wheat=5₪, barley=7₪, grapes=10₪
  (one full field harvest cycle = 50₪, enough for the first tile)
- Sell button disabled when < 10 of that crop
- Dilemma `wheatCost` system **unchanged** — crops still matter morally
- Shekels shown in the HUD alongside crops
- Persist version: 14 → 15; migration backfills `shekels: 5000`

## Files to Modify

### 1. `src/types/index.ts`
Add `shekels: number` to `GameState`.

### 2. `src/game/constants.ts`
Add:
```ts
export const INITIAL_SHEKELS = 5_000
export const SELL_BULK_SIZE = 10
export const SELL_PRICE: Record<CropType, number> = { wheat: 5, barley: 7, grapes: 10 }
```

### 3. `src/store/game/state.ts`
Add `shekels: INITIAL_SHEKELS` to `initialState`.

### 4. `src/store/game/store-types.ts`
Add `sellCrops: (cropType: CropType) => void` to `GameActions`.

### 5. `src/store/game/economy-actions.ts`
- `buyTile`: change guard from `s.wheat < price` → `s.shekels < price`; deduct `shekels` instead of `wheat`
- Add `sellCrops(cropType)`: guard `s[cropType] < SELL_BULK_SIZE`; return `s` as no-op; else deduct 10 from crop, add `10 * SELL_PRICE[cropType]` to shekels
- Add `sellCrops` to the `Pick<GameActions, ...>` type

### 6. `src/store/game/migrations.ts`
Add v15 block:
```ts
if (version < 15) {
    state.shekels = typeof state.shekels === 'number' ? state.shekels : 5_000
}
```

### 7. `src/store/game-store.ts`
- Bump persist `version: 14` → `version: 15`
- Add `shekels: state.shekels` to `partialize`

### 8. `src/components/WheatCounter.tsx`
- Select `shekels` and `sellCrops` from store
- Show `₪ {shekels.toLocaleString()}` row at top (always visible)
- Add `[Sell]` button next to each crop; disabled when crop < `SELL_BULK_SIZE`; calls `sellCrops(cropType)`

### 9. `src/components/WheatCounter.module.css`
Add styles for: sell button, shekel row (gold/amber color `#d4a017` to match ProgressRing).

## Tests to Add/Update

### `src/store/game-store.economy.test.ts`
- Update existing `buyTile` tests: set `shekels` instead of `wheat` on initial state
- Add `sellCrops` tests:
  - selling when < 10 → no-op
  - selling 10 wheat → -10 wheat, +50₪
  - selling 10 barley → +70₪
  - selling 10 grapes → +100₪

### `src/store/game-store.migrations.test.ts`
- Add v15 migration test: `shekels` absent → backfilled to 5000
- Add v15 migration test: `shekels: 1234` present → preserved

## Verification

```bash
npm test                    # all Vitest tests pass (expect ~+10 tests)
npx playwright test         # E2E still passes
npm run dev                 # manual: HUD shows ₪5,000; harvest wheat, sell → ₪ increases; buy tile → ₪ decreases
```

Manual smoke test:
1. Fresh game shows `₪ 5,000` in HUD
2. Harvest wheat → sell button enables; tap sell → 10 wheat consumed, `₪ 5,050`
3. Attempt buy tile with < 50₪ → no-op (tile stays locked)
4. Accumulate 50₪+ → buy tile succeeds, shekels decrease
5. Reload page → shekels persist correctly
