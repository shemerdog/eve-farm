import type { MeterValues } from '@/types'

export const PLOT_COUNT = 4

// 15 seconds — fast enough to test, slow enough to feel like waiting
export const WHEAT_GROWTH_DURATION = 15_000

export const WHEAT_PER_HARVEST = 10

// Dilemma fires after every N harvests
export const HARVESTS_TO_TRIGGER_DILEMMA = 2

export const METER_INITIAL: MeterValues = {
  devotion: 50,
  morality: 50,
  faithfulness: 50,
}

// Wheat rounding rule: always floor fractional costs.
// Generous to the player; consistent with how physical grain works.
export const applyWheatCost = (current: number, cost: number): number =>
  current - Math.floor(cost)

// Clamp a meter value to [0, 100]
export const clampMeter = (value: number): number =>
  Math.max(0, Math.min(100, value))
