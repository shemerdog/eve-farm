// PlotState: 'planted' is dropped — planting goes directly to 'growing'.
// This removes a transient state with no distinct visual behavior.
export type PlotState =
  | "empty"
  | "plowed"
  | "growing"
  | "ready"
  | "harvested"
  | "gathered";

export type CropType = "wheat" | "grapes" | "barley";

export type TileCategory = "field" | "orchard";
export type TileSubcategory = "wheat" | "barley" | "grapes";

export type Plot = {
  id: string; // "col_row_idx", e.g. "2_2_0"
  state: PlotState;
  plantedAt: number | null; // timestamp (ms) set when plant action fires
  growthDuration: number; // ms, from constants — kept per-plot for future tuning
  tileCoord: TileCoord; // which map tile this plot belongs to
  cropType: CropType; // what crop grows on this plot
};

export type MeterValues = {
  devotion: number; // 0–100
  morality: number; // 0–100
  faithfulness: number; // 0–100
};

export type DilemmaChoice = {
  label: string;
  description: string;
  wheatCost: number; // fractional allowed; applyWheatCost floors before deducting
  meterEffect: Partial<MeterValues>;
};

export type Dilemma = {
  id: string;
  title: string;
  narrative: string;
  choices: DilemmaChoice[];
};

export type SavedFieldDecision = {
  choiceIndex: number;
  cyclesRemaining: number; // counts down from 5; entry removed when it reaches 0
};

export type GameState = {
  plots: Plot[];
  wheat: number;
  grapes: number;
  barley: number;
  meters: MeterValues;
  activeDilemma: Dilemma | null;
  // Which crop type triggered the current dilemma (set alongside activeDilemma)
  activeDilemmaContext: CropType | null;
  purchasedCoords: TileCoord[]; // tiles the player has bought; drives price formula via .length
  tileCategories: Record<string, TileCategory>; // keyed by "col_row"; defaults to "farm"
  // Keyed by "<dilemmaId>:<cropType>" (e.g. "peah:wheat", "shikchah:barley"); only field-crop dilemmas are saveable
  savedFieldDecisions: Record<string, SavedFieldDecision>;
};

// ── World Map ────────────────────────────────────────────────────────────────

export type TileCoord = { col: number; row: number };

export type TileType = "farm" | "locked";

export type MapTile = {
  coord: TileCoord;
  type: TileType;
};

export type CameraState = {
  x: number; // pixel offset applied to the world canvas
  y: number;
  zoom: number; // scale factor; 1.0 = default, range [MIN_ZOOM, MAX_ZOOM]
};

export type WorldMapState = {
  camera: CameraState;
};
