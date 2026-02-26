import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createBuildingActions } from '@/store/game/building-actions'
import { createDilemmaActions } from '@/store/game/dilemma-actions'
import { createEconomyActions } from '@/store/game/economy-actions'
import { migratePersistedGameState } from '@/store/game/migrations'
import { createPlotActions } from '@/store/game/plot-actions'
import { initialState, makePlots, type PersistedGameState } from '@/store/game/state'
import type { GameStore } from '@/store/game/store-types'
import { FARM_COORD } from '@/game/world-map'

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            ...initialState,
            ...createPlotActions(set),
            ...createDilemmaActions(set, get),
            ...createEconomyActions(set),
            ...createBuildingActions(set),
        }),
        {
            name: 'eve-game-state',
            version: 15,
            // Only persist the data fields, not the action functions
            partialize: (state): PersistedGameState => ({
                plots: state.plots,
                wheat: state.wheat,
                grapes: state.grapes,
                barley: state.barley,
                shekels: state.shekels,
                meters: state.meters,
                activeDilemma: state.activeDilemma,
                activeDilemmaContext: state.activeDilemmaContext,
                activePlotId: state.activePlotId,
                purchasedCoords: state.purchasedCoords,
                tileCategories: state.tileCategories,
                savedFieldDecisions: state.savedFieldDecisions,
                encounteredDilemmas: state.encounteredDilemmas,
                buildingSlots: state.buildingSlots,
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
