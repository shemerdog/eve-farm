// PlotState: 'planted' is dropped — planting goes directly to 'growing'.
// This removes a transient state with no distinct visual behavior.
export type PlotState = 'empty' | 'growing' | 'ready' | 'harvested'

export type Plot = {
  id: number         // 0–3
  state: PlotState
  plantedAt: number | null  // timestamp (ms) set when plant action fires
  growthDuration: number    // ms, from constants — kept per-plot for future tuning
}

export type MeterValues = {
  devotion: number      // 0–100
  morality: number      // 0–100
  faithfulness: number  // 0–100
}

export type DilemmaChoice = {
  label: string
  description: string
  wheatCost: number             // fractional allowed; applyWheatCost floors before deducting
  meterEffect: Partial<MeterValues>
}

export type Dilemma = {
  id: string
  title: string
  narrative: string
  choices: DilemmaChoice[]
}

export type GameState = {
  plots: Plot[]
  wheat: number
  meters: MeterValues
  activeDilemma: Dilemma | null
  harvestsSinceLastDilemma: number
  dilemmaIndex: number   // cycles through DILEMMAS array deterministically
}

// ── World Map ────────────────────────────────────────────────────────────────

export type TileCoord = { col: number; row: number }

export type TileType = 'farm' | 'locked'

export type MapTile = {
  coord: TileCoord
  type: TileType
}

export type CameraState = {
  x: number  // pixel offset applied to the world canvas
  y: number
}

export type WorldMapState = {
  camera: CameraState
}
