import type { StateCreator } from 'zustand'
import type { GameState, TileCategory, TileCoord, TileSubcategory } from '@/types'

export type GameActions = {
    plowPlot: (plotId: string) => void
    plantWheat: (plotId: string) => void
    plantOrchard: (plotId: string) => void
    fertilizePlot: (plotId: string) => void
    tendPlot: (plotId: string) => void
    thinShoots: (plotId: string) => void
    tickGrowth: () => void
    harvest: (plotId: string) => void
    gatherSheafs: (plotId: string) => void
    resolveDilemma: (choiceIndex: number, save?: boolean) => void
    toggleDecisionEnabled: (key: string) => void
    resetPlot: (plotId: string) => void
    buyTile: (coord: TileCoord, category: TileCategory, subcategory: TileSubcategory) => void
    resetGame: () => void
}

export type GameStore = GameState & GameActions

export type SetState = Parameters<StateCreator<GameStore>>[0]
export type GetState = Parameters<StateCreator<GameStore>>[1]
