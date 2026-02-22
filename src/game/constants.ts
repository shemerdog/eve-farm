import type { MeterValues } from "@/types";

export const PLOT_COUNT = 4;

// 15 seconds — fast enough to test, slow enough to feel like waiting
export const WHEAT_GROWTH_DURATION = 15_000;

export const WHEAT_PER_HARVEST = 10;

export const METER_INITIAL: MeterValues = {
  devotion: 50,
  morality: 50,
  faithfulness: 50,
};

// Wheat rounding rule: always floor fractional costs.
// Generous to the player; consistent with how physical grain works.
export const applyWheatCost = (current: number, cost: number): number =>
  current - Math.floor(cost);

// Clamp a meter value to [0, 100]
export const clampMeter = (value: number): number =>
  Math.max(0, Math.min(100, value));

// ── Tile purchasing ───────────────────────────────────────────────────────────

export const BASE_TILE_PRICE = 50;
export const TILE_PRICE_MULTIPLIER = 1.6;

// price(n) = floor(50 * 1.6^n) where n = tiles already purchased.
// Floors consistently with applyWheatCost — generous to the player.
export const calcTilePrice = (tilesPurchased: number): number =>
  Math.floor(BASE_TILE_PRICE * Math.pow(TILE_PRICE_MULTIPLIER, tilesPurchased));
