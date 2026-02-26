import type { BuildingSlot, CropType, GameState, Plot, TileCoord } from '@/types'

/** The data shape that Zustand's persist middleware writes to localStorage.
 *  Equals GameState because all state fields are persisted (actions are excluded
 *  by the partialize function in game-store.ts). */
export type PersistedGameState = GameState
import {
    BARLEY_GROWTH_DURATION,
    BUILDING_SLOT_COUNT,
    GRAPE_GROWTH_DURATION,
    INITIAL_SHEKELS,
    METER_INITIAL,
    PLOT_COUNT,
    WHEAT_GROWTH_DURATION,
} from '@/game/constants'
import { FARM_COORD } from '@/game/world-map'

const growthDurationByCropType: Record<CropType, number> = {
    wheat: WHEAT_GROWTH_DURATION,
    grapes: GRAPE_GROWTH_DURATION,
    barley: BARLEY_GROWTH_DURATION,
}

export const makeStructureSlots = (coord: TileCoord): BuildingSlot[] =>
    Array.from({ length: BUILDING_SLOT_COUNT }, (_, i) => ({
        id: `s${coord.col}_${coord.row}_${i}`,
        tileCoord: coord,
        buildingType: null,
        state: 'empty' as const,
    }))

export const makePlots = (coord: TileCoord, cropType: CropType = 'wheat'): Plot[] =>
    Array.from({ length: PLOT_COUNT }, (_, i) => ({
        id: `${coord.col}_${coord.row}_${i}`,
        state: 'empty' as const,
        plantedAt: null,
        growthDuration: growthDurationByCropType[cropType],
        tileCoord: coord,
        cropType,
        hasBeenPlanted: false,
        nextActionAt: null,
        stepWaitDuration: null,
        harvestCount: 0,
    }))

export const initialState: GameState = {
    plots: makePlots(FARM_COORD),
    wheat: 0,
    grapes: 0,
    barley: 0,
    shekels: INITIAL_SHEKELS,
    meters: { ...METER_INITIAL },
    activeDilemma: null,
    activeDilemmaContext: null,
    activePlotId: null,
    purchasedCoords: [],
    tileCategories: {},
    savedFieldDecisions: {},
    encounteredDilemmas: [],
    buildingSlots: [],
}
