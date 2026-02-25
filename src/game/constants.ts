import type { MeterValues } from '@/types'

export const PLOT_COUNT = 4
export const BUILDING_SLOT_COUNT = 4

// 15 seconds — fast enough to test, slow enough to feel like waiting
export const WHEAT_GROWTH_DURATION = 15_000

export const WHEAT_PER_HARVEST = 10

// Grapes grow slower but yield more — 30 s growth, 15 grapes per harvest
export const GRAPE_GROWTH_DURATION = 30_000
export const GRAPES_PER_HARVEST = 15

// Barley grows between wheat and grapes — 20 s growth, 12 barley per harvest
export const BARLEY_GROWTH_DURATION = 20_000
export const BARLEY_PER_HARVEST = 12

export const METER_INITIAL: MeterValues = {
    devotion: 50,
    morality: 50,
    faithfulness: 50,
}

// Wheat rounding rule: always floor fractional costs.
// Generous to the player; consistent with how physical grain works.
export const applyWheatCost = (current: number, cost: number): number => current - Math.floor(cost)

// Clamp a meter value to [0, 100]
export const clampMeter = (value: number): number => Math.max(0, Math.min(100, value))

// ── Orchard step wait timers ─────────────────────────────────────────────────

// How long (ms) the Tend button is locked after fertilizing
export const FERTILIZE_WAIT_DURATION = 10_000
// How long (ms) the Thin Shoots button is locked after tending
export const TEND_WAIT_DURATION = 10_000

// ── Tile purchasing ───────────────────────────────────────────────────────────

export const BASE_TILE_PRICE = 50
export const TILE_PRICE_MULTIPLIER = 1.6

// price(n) = floor(50 * 1.6^n) where n = tiles already purchased.
// Floors consistently with applyWheatCost — generous to the player.
export const calcTilePrice = (tilesPurchased: number): number =>
    Math.floor(BASE_TILE_PRICE * Math.pow(TILE_PRICE_MULTIPLIER, tilesPurchased))
