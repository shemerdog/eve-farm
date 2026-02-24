import type { CropType, TileCategory, TileCoord, TileSubcategory } from '@/types'
import { calcTilePrice } from '@/game/constants'
import { FARM_COORD, isAdjacentToUnlocked, isPurchased } from '@/game/world-map'
import type { GameActions, SetState } from './store-types'
import { initialState, makePlots } from './state'

export const createEconomyActions = (set: SetState): Pick<GameActions, 'buyTile' | 'resetGame'> => ({
    buyTile: (coord: TileCoord, category: TileCategory, subcategory: TileSubcategory): void => {
        set((s) => {
            const price = calcTilePrice(s.purchasedCoords.length)
            if (
                s.wheat < price ||
                !isAdjacentToUnlocked(coord, s.purchasedCoords) ||
                isPurchased(coord, s.purchasedCoords)
            )
                return s
            const cropType: CropType = subcategory
            const key = `${coord.col}_${coord.row}`
            return {
                wheat: Math.max(0, s.wheat - price),
                purchasedCoords: [...s.purchasedCoords, coord],
                plots: [...s.plots, ...makePlots(coord, cropType)],
                tileCategories: { ...s.tileCategories, [key]: category },
            }
        })
    },

    resetGame: (): void => {
        set({
            ...initialState,
            plots: makePlots(FARM_COORD),
            tileCategories: {},
        })
    },
})
