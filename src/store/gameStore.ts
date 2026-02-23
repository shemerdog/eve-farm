import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CropType,
  Dilemma,
  GameState,
  MeterValues,
  Plot,
  SavedFieldDecision,
  TileCategory,
  TileSubcategory,
  TileCoord,
} from "@/types";
import {
  PLOT_COUNT,
  WHEAT_GROWTH_DURATION,
  WHEAT_PER_HARVEST,
  GRAPE_GROWTH_DURATION,
  GRAPES_PER_HARVEST,
  BARLEY_GROWTH_DURATION,
  BARLEY_PER_HARVEST,
  METER_INITIAL,
  applyWheatCost,
  clampMeter,
  calcTilePrice,
  FERTILIZE_WAIT_DURATION,
  TEND_WAIT_DURATION,
} from "@/game/constants";
import { tickPlot } from "@/game/gameTick";
import { DILEMMAS, ORLAH_DILEMMA } from "@/game/dilemmas";
import { FARM_COORD, isAdjacentToUnlocked, isPurchased } from "@/game/worldMap";

const GROWTH_DURATION: Record<CropType, number> = {
  wheat: WHEAT_GROWTH_DURATION,
  grapes: GRAPE_GROWTH_DURATION,
  barley: BARLEY_GROWTH_DURATION,
};

const makePlots = (coord: TileCoord, cropType: CropType = "wheat"): Plot[] =>
  Array.from({ length: PLOT_COUNT }, (_, i) => ({
    id: `${coord.col}_${coord.row}_${i}`,
    state: "empty" as const,
    plantedAt: null,
    growthDuration: GROWTH_DURATION[cropType],
    tileCoord: coord,
    cropType,
    hasBeenPlanted: false,
    nextActionAt: null,
    harvestCount: 0,
  }));

const PEAH_DILEMMA = DILEMMAS.find((d) => d.id === "peah")!;
const SHIKCHAH_DILEMMA = DILEMMAS.find((d) => d.id === "shikchah")!;

const SAVEABLE_DILEMMA_IDS = new Set(["peah", "shikchah"]);

/** Apply a dilemma choice to wheat + meters and return the new values. */
function applyDilemmaChoice(
  dilemma: Dilemma,
  choiceIndex: number,
  wheat: number,
  meters: MeterValues,
): { wheat: number; meters: MeterValues } {
  const choice = dilemma.choices[choiceIndex];
  return {
    wheat: Math.max(0, applyWheatCost(wheat, choice.wheatCost)),
    meters: {
      devotion: clampMeter(
        meters.devotion + (choice.meterEffect.devotion ?? 0),
      ),
      morality: clampMeter(
        meters.morality + (choice.meterEffect.morality ?? 0),
      ),
      faithfulness: clampMeter(
        meters.faithfulness + (choice.meterEffect.faithfulness ?? 0),
      ),
    },
  };
}

/** Decrement cyclesRemaining for a saved decision, removing it when it hits 0. */
function decrementSaved(
  saved: Record<string, SavedFieldDecision>,
  key: string,
): Record<string, SavedFieldDecision> {
  const entry = saved[key];
  if (!entry) return saved;
  if (entry.cyclesRemaining <= 1) {
    return Object.fromEntries(Object.entries(saved).filter(([k]) => k !== key));
  }
  return {
    ...saved,
    [key]: { ...entry, cyclesRemaining: entry.cyclesRemaining - 1 },
  };
}

const initialState: GameState = {
  plots: makePlots(FARM_COORD),
  wheat: 0,
  grapes: 0,
  barley: 0,
  meters: { ...METER_INITIAL },
  activeDilemma: null,
  activeDilemmaContext: null,
  activePlotId: null,
  purchasedCoords: [],
  tileCategories: {},
  savedFieldDecisions: {},
};

type Actions = {
  plowPlot: (plotId: string) => void;
  plantWheat: (plotId: string) => void;
  // Orchard-specific cycle actions:
  plantOrchard: (plotId: string) => void;
  fertilizePlot: (plotId: string) => void;
  tendPlot: (plotId: string) => void;
  thinShoots: (plotId: string) => void;
  tickGrowth: () => void;
  harvest: (plotId: string) => void;
  gatherSheafs: (plotId: string) => void;
  resolveDilemma: (choiceIndex: number, save?: boolean) => void;
  resetPlot: (plotId: string) => void;
  buyTile: (
    coord: TileCoord,
    category: TileCategory,
    subcategory: TileSubcategory,
  ) => void;
  resetGame: () => void;
};

export const useGameStore = create<GameState & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      plowPlot: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId && p.state === "empty"
              ? { ...p, state: "plowed" }
              : p,
          ),
        }));
      },

      plantWheat: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId && p.state === "plowed"
              ? { ...p, state: "growing", plantedAt: Date.now() }
              : p,
          ),
        }));
      },

      plantOrchard: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId && p.state === "empty" && !p.hasBeenPlanted
              ? { ...p, state: "planted", hasBeenPlanted: true }
              : p,
          ),
        }));
      },

      fertilizePlot: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId &&
            (p.state === "planted" || (p.state === "empty" && p.hasBeenPlanted))
              ? {
                  ...p,
                  state: "fertilized",
                  nextActionAt: Date.now() + FERTILIZE_WAIT_DURATION,
                }
              : p,
          ),
        }));
      },

      tendPlot: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) => {
            if (
              p.id !== plotId ||
              p.state !== "fertilized" ||
              p.nextActionAt !== null
            )
              return p;
            // Grapes require shoot thinning next; other orchards go straight to growing
            if (p.cropType === "grapes") {
              return {
                ...p,
                state: "tended",
                nextActionAt: Date.now() + TEND_WAIT_DURATION,
              };
            }
            return {
              ...p,
              state: "growing",
              plantedAt: Date.now(),
              nextActionAt: null,
            };
          }),
        }));
      },

      thinShoots: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId &&
            p.state === "tended" &&
            p.cropType === "grapes" &&
            p.nextActionAt === null
              ? { ...p, state: "growing", plantedAt: Date.now() }
              : p,
          ),
        }));
      },

      tickGrowth: () => {
        const now = Date.now();
        set((s) => ({
          plots: s.plots.map((p) => tickPlot(p, now)),
        }));
      },

      harvest: (plotId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);
        if (!plot || plot.state !== "ready") return;

        const dilemmaForCrop =
          plot.cropType === "grapes" ? ORLAH_DILEMMA : PEAH_DILEMMA;

        const plotsUpdated = state.plots.map((p) =>
          p.id === plotId ? { ...p, state: "harvested" as const } : p,
        );

        // Auto-resolve PEAH for wheat/barley when a saved decision exists
        const isFieldCropHarvest =
          plot.cropType === "wheat" || plot.cropType === "barley";
        if (isFieldCropHarvest && state.activeDilemma === null) {
          const peahKey = `peah:${plot.cropType}`;
          const saved = state.savedFieldDecisions[peahKey];
          if (saved && saved.cyclesRemaining > 0) {
            const { wheat, meters } = applyDilemmaChoice(
              PEAH_DILEMMA,
              saved.choiceIndex,
              state.wheat,
              state.meters,
            );
            set({
              plots: plotsUpdated,
              wheat,
              meters,
              savedFieldDecisions: decrementSaved(
                state.savedFieldDecisions,
                peahKey,
              ),
            });
            setTimeout(() => get().resetPlot(plotId), 600);
            return;
          }
        }

        set((s) => ({
          plots: plotsUpdated,
          activeDilemma:
            state.activeDilemma === null ? dilemmaForCrop : s.activeDilemma,
          activeDilemmaContext:
            state.activeDilemma === null
              ? plot.cropType
              : s.activeDilemmaContext,
        }));

        // Transition harvested → gathered after animation window (600ms)
        setTimeout(() => get().resetPlot(plotId), 600);
      },

      gatherSheafs: (plotId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);
        if (!plot || plot.state !== "gathered") return;

        const yieldAmount =
          plot.cropType === "grapes"
            ? GRAPES_PER_HARVEST
            : plot.cropType === "barley"
              ? BARLEY_PER_HARVEST
              : WHEAT_PER_HARVEST;

        const isFieldCrop =
          plot.cropType === "wheat" || plot.cropType === "barley";
        const triggerShikchah = isFieldCrop && state.activeDilemma === null;

        const plotsReset = state.plots.map((p) =>
          p.id === plotId
            ? { ...p, state: "empty" as const, plantedAt: null }
            : p,
        );
        const wheatAfterYield =
          plot.cropType === "wheat" ? state.wheat + yieldAmount : state.wheat;
        const grapesAfterYield =
          plot.cropType === "grapes"
            ? state.grapes + yieldAmount
            : state.grapes;
        const barleyAfterYield =
          plot.cropType === "barley"
            ? state.barley + yieldAmount
            : state.barley;

        // Auto-resolve SHIKCHAH when a saved decision exists for field crops
        if (triggerShikchah) {
          const shikchahKey = `shikchah:${plot.cropType}`;
          const saved = state.savedFieldDecisions[shikchahKey];
          if (saved && saved.cyclesRemaining > 0) {
            const { wheat, meters } = applyDilemmaChoice(
              SHIKCHAH_DILEMMA,
              saved.choiceIndex,
              wheatAfterYield,
              state.meters,
            );
            set({
              plots: plotsReset,
              wheat,
              grapes: grapesAfterYield,
              barley: barleyAfterYield,
              meters,
              savedFieldDecisions: decrementSaved(
                state.savedFieldDecisions,
                shikchahKey,
              ),
            });
            return;
          }
        }

        set((s) => ({
          plots: plotsReset,
          wheat: plot.cropType === "wheat" ? s.wheat + yieldAmount : s.wheat,
          grapes:
            plot.cropType === "grapes" ? s.grapes + yieldAmount : s.grapes,
          barley:
            plot.cropType === "barley" ? s.barley + yieldAmount : s.barley,
          activeDilemma: triggerShikchah ? SHIKCHAH_DILEMMA : s.activeDilemma,
          activeDilemmaContext: triggerShikchah
            ? plot.cropType
            : s.activeDilemmaContext,
        }));
      },

      resolveDilemma: (choiceIndex, save = false) => {
        const {
          activeDilemma,
          activeDilemmaContext,
          wheat,
          meters,
          savedFieldDecisions,
        } = get();
        if (!activeDilemma) return;

        const choice = activeDilemma.choices[choiceIndex];
        if (!choice) return;

        const { wheat: newWheat, meters: newMeters } = applyDilemmaChoice(
          activeDilemma,
          choiceIndex,
          wheat,
          meters,
        );

        const isSaveable = SAVEABLE_DILEMMA_IDS.has(activeDilemma.id);
        const saveKey =
          isSaveable && activeDilemmaContext
            ? `${activeDilemma.id}:${activeDilemmaContext}`
            : activeDilemma.id;
        const newSavedDecisions =
          save && isSaveable && activeDilemmaContext
            ? {
                ...savedFieldDecisions,
                [saveKey]: { choiceIndex, cyclesRemaining: 5 },
              }
            : savedFieldDecisions;

        set({
          wheat: newWheat,
          meters: newMeters,
          activeDilemma: null,
          activeDilemmaContext: null,
          savedFieldDecisions: newSavedDecisions,
        });
      },

      resetPlot: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId && p.state === "harvested"
              ? { ...p, state: "gathered" }
              : p,
          ),
        }));
      },

      buyTile: (coord, category, subcategory) => {
        set((s) => {
          const price = calcTilePrice(s.purchasedCoords.length);
          if (
            s.wheat < price ||
            !isAdjacentToUnlocked(coord, s.purchasedCoords) ||
            isPurchased(coord, s.purchasedCoords)
          )
            return s;
          const cropType: CropType = subcategory;
          const key = `${coord.col}_${coord.row}`;
          return {
            wheat: Math.max(0, s.wheat - price),
            purchasedCoords: [...s.purchasedCoords, coord],
            plots: [...s.plots, ...makePlots(coord, cropType)],
            tileCategories: { ...s.tileCategories, [key]: category },
          };
        });
      },

      resetGame: () => {
        set({
          ...initialState,
          plots: makePlots(FARM_COORD),
          tileCategories: {},
        });
      },
    }),
    {
      name: "eve-game-state",
      version: 11,
      // Only persist the data fields, not the action functions
      partialize: (state) => ({
        plots: state.plots,
        wheat: state.wheat,
        grapes: state.grapes,
        barley: state.barley,
        meters: state.meters,
        activeDilemma: state.activeDilemma,
        activeDilemmaContext: state.activeDilemmaContext,
        activePlotId: state.activePlotId,
        purchasedCoords: state.purchasedCoords,
        tileCategories: state.tileCategories,
        savedFieldDecisions: state.savedFieldDecisions,
      }),
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;
        if (version < 2) {
          // Convert old numeric plot IDs to string format and add tileCoord
          const farmCoord = FARM_COORD;
          state.plots = (state.plots ?? []).map(
            (p: { id: number }, i: number) => ({
              ...p,
              id: `${farmCoord.col}_${farmCoord.row}_${typeof p.id === "number" ? p.id : i}`,
              tileCoord: farmCoord,
            }),
          );
          // Re-create plots for any purchased tiles (they had no plots before)
          const purchased: TileCoord[] = state.purchasedCoords ?? [];
          for (const coord of purchased) {
            state.plots.push(...makePlots(coord));
          }
        }
        if (version < 3) {
          // Drop fields removed when Peah was changed to trigger every harvest
          delete state.harvestsSinceLastDilemma;
          delete state.dilemmaIndex;
        }
        if (version < 4) {
          // Backfill cropType on existing plots (all were wheat before vineyards)
          state.plots = (state.plots ?? []).map((p: Partial<Plot>) => ({
            ...p,
            cropType: p.cropType ?? "wheat",
          }));
          // Initialize tileCategories if absent
          state.tileCategories = state.tileCategories ?? {};
        }
        if (version < 5) {
          // Backfill barley counter for saves that predate barley
          state.barley = state.barley ?? 0;
        }
        if (version < 6 && state.tileCategories) {
          // Rename old category keys: "farm" → "field", "vineyard" → "orchard", old "field" → "field"
          state.tileCategories = Object.entries(
            state.tileCategories as Record<string, string>,
          ).reduce(
            (acc, [key, cat]) => ({
              ...acc,
              [key]: cat === "vineyard" ? "orchard" : "field",
            }),
            {},
          );
        }
        if (version < 7) {
          // Add savedFieldDecisions for saves that predate this feature
          state.savedFieldDecisions = state.savedFieldDecisions ?? {};
        }
        if (version < 8) {
          // Rename saved decision keys to be crop-qualified:
          // "peah" → "peah:wheat", "shikchah" → "shikchah:wheat"
          // (barley previously used Omer with no saved decisions)
          const sfd = state.savedFieldDecisions ?? {};
          if (sfd["peah"] !== undefined) {
            sfd["peah:wheat"] = sfd["peah"];
            delete sfd["peah"];
          }
          if (sfd["shikchah"] !== undefined) {
            sfd["shikchah:wheat"] = sfd["shikchah"];
            delete sfd["shikchah"];
          }
          state.savedFieldDecisions = sfd;
          state.activeDilemmaContext = state.activeDilemmaContext ?? null;
        }
        if (version < 9) {
          // Backfill hasBeenPlanted on all existing plots (existing orchards restart from first cycle)
          state.plots = (state.plots ?? []).map((p: Partial<Plot>) => ({
            ...p,
            hasBeenPlanted: p.hasBeenPlanted ?? false,
          }));
        }
        if (version < 10) {
          // Backfill nextActionAt on all existing plots (no pending timers for existing saves)
          state.plots = (state.plots ?? []).map((p: Partial<Plot>) => ({
            ...p,
            nextActionAt: p.nextActionAt ?? null,
          }));
        }
        if (version < 11) {
          // Backfill harvestCount on all plots and activePlotId on state
          state.activePlotId = state.activePlotId ?? null;
          state.plots = (state.plots ?? []).map((p: Partial<Plot>) => ({
            ...p,
            harvestCount: p.harvestCount ?? 0,
          }));
        }
        return state as GameState;
      },
    },
  ),
);
