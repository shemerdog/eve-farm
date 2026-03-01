// PlotState: orchards use planted→fertilized→tended→(thinned for grapes)→growing.
// Fields (wheat, barley) use plowed→growing directly.
export enum PlotState {
    Empty = 'Empty',
    Plowed = 'Plowed',
    Planted = 'Planted', // orchard first cycle: vine/tree just planted
    Fertilized = 'Fertilized', // orchard: after fertilizing (every cycle)
    Tended = 'Tended', // orchard: after pruning/tending (grapes need thinning next)
    Growing = 'Growing',
    Ready = 'Ready',
    Harvested = 'Harvested',
    Gathered = 'Gathered',
}

export enum CropType {
    Wheat = 'Wheat',
    Barley = 'Barley',
    Grapes = 'Grapes',
}

export enum TileCategory {
    Field = 'Field',
    Orchard = 'Orchard',
    Structure = 'Structure',
}

export enum TileSubcategory {
    Wheat = 'Wheat',
    Barley = 'Barley',
    Grapes = 'Grapes',
    Structure = 'Structure',
}

export enum BuildingType {
    Farmhouse = 'Farmhouse',
    Barn = 'Barn',
    Sheepfold = 'Sheepfold',
    Silo = 'Silo',
}

export type BuildingSlot = {
    id: string // format: "s{col}_{row}_{i}" e.g. "s2_1_0"
    tileCoord: TileCoord
    buildingType: BuildingType | null // null = empty slot
    state: 'empty' | 'built'
}

export type Plot = {
    id: string // "col_row_idx", e.g. "2_2_0"
    state: PlotState
    plantedAt: number | null // timestamp (ms) set when plant action fires
    growthDuration: number // ms, from constants — kept per-plot for future tuning
    tileCoord: TileCoord // which map tile this plot belongs to
    cropType: CropType // what crop grows on this plot
    hasBeenPlanted: boolean // orchard: true after first plantOrchard; skips plant step on subsequent cycles
    nextActionAt: number | null // null = action available now; timestamp = locked until this time
    stepWaitDuration: number | null // ms duration of the current step wait (set alongside nextActionAt, cleared with it)
    harvestCount: number // increments each harvest(); used to gate ORLAH (cycles 1–3) and NETA_REVAI (cycle 4)
}

export type MeterValues = {
    devotion: number // 0–100
    morality: number // 0–100
    faithfulness: number // 0–100
}

export type DilemmaChoice = {
    label: string
    description: string
    cropCost: number // fractional allowed; applyWheatCost floors before deducting. Deducted from the context crop (wheat/barley/grapes).
    meterEffect: Partial<MeterValues>
}

export type Dilemma = {
    id: string
    title: string
    narrative: string
    choices: DilemmaChoice[]
}

export type SavedFieldDecision = {
    choiceIndex: number
    cyclesRemaining: number // counts down from 5; entry removed when it reaches 0
    enabled: boolean // when false, auto-resolve is skipped (dilemma shows modal)
}

export type GameState = {
    plots: Plot[]
    wheat: number
    grapes: number
    barley: number
    shekels: number
    meters: MeterValues
    activeDilemma: Dilemma | null
    // Which crop type triggered the current dilemma (set alongside activeDilemma)
    activeDilemmaContext: CropType | null
    // plotId that triggered the active dilemma; used by resolveDilemma to reset the plot on skip-gather choices
    activePlotId: string | null
    purchasedCoords: TileCoord[] // tiles the player has bought; drives price formula via .length
    tileCategories: Record<string, TileCategory> // keyed by "col_row"; defaults to "farm"
    // Keyed by "<dilemmaId>:<cropType>" (e.g. "peah:wheat", "shikchah:barley"); only field-crop dilemmas are saveable
    savedFieldDecisions: Record<string, SavedFieldDecision>
    encounteredDilemmas: string[] // e.g. ["peah:wheat", "shikchah:barley"]
    buildingSlots: BuildingSlot[]
}

// ── World Map ────────────────────────────────────────────────────────────────

export type TileCoord = { col: number; row: number }

export enum TileType {
    Wheat = 'Wheat', // was 'farm' — renamed for explicitness
    Locked = 'Locked',
}

export type MapTile = {
    coord: TileCoord
    type: TileType
}

export type CameraState = {
    x: number // pixel offset applied to the world canvas
    y: number
    zoom: number // scale factor; 1.0 = default, range [MIN_ZOOM, MAX_ZOOM]
}

export type WorldMapState = {
    camera: CameraState
}
