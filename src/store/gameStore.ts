import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDilemmaActions } from '@/store/game/dilemmaActions'
import { createEconomyActions } from '@/store/game/economyActions'
import { migratePersistedGameState } from '@/store/game/migrations'
import { createPlotActions } from '@/store/game/plotActions'
import { initialState, makePlots } from '@/store/game/state'
import type { GameStore } from '@/store/game/storeTypes'
import { FARM_COORD } from '@/game/worldMap'

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            ...initialState,
            ...createPlotActions(set),
            ...createDilemmaActions(set, get),
            ...createEconomyActions(set),
        }),
        {
            name: 'eve-game-state',
            version: 12,
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
                encounteredDilemmas: state.encounteredDilemmas,
            }),
            migrate: (persisted, version) =>
                migratePersistedGameState({
                    persisted,
                    version,
                    farmCoord: FARM_COORD,
                    makePlots,
                }),
        },
    ),
)
