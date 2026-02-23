import type { CropType, GameState, Plot, TileCoord } from '@/types'
import {
    BARLEY_GROWTH_DURATION,
    GRAPE_GROWTH_DURATION,
    METER_INITIAL,
    PLOT_COUNT,
    WHEAT_GROWTH_DURATION,
} from '@/game/constants'
import { FARM_COORD } from '@/game/worldMap'

const growthDurationByCropType: Record<CropType, number> = {
    wheat: WHEAT_GROWTH_DURATION,
    grapes: GRAPE_GROWTH_DURATION,
    barley: BARLEY_GROWTH_DURATION,
}

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
        harvestCount: 0,
    }))

export const initialState: GameState = {
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
    encounteredDilemmas: [],
}
