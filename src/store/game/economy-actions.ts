import type { CropType, TileCategory, TileCoord, TileSubcategory } from '@/types'
import { calcTilePrice } from '@/game/constants'
import { FARM_COORD, isAdjacentToUnlocked, isPurchased } from '@/game/world-map'
import type { GameActions, SetState } from './store-types'
import { initialState, makePlots, makeStructureSlots } from './state'

export const createEconomyActions = (
    set: SetState,
): Pick<GameActions, 'buyTile' | 'resetGame'> => ({
    buyTile: (coord: TileCoord, category: TileCategory, subcategory: TileSubcategory): void => {
        set((s) => {
            const price = calcTilePrice(s.purchasedCoords.length)
            if (
                s.wheat < price ||
                !isAdjacentToUnlocked(coord, s.purchasedCoords) ||
                isPurchased(coord, s.purchasedCoords)
            )
                return s
            const key = `${coord.col}_${coord.row}`
            const base = {
                wheat: Math.max(0, s.wheat - price),
                purchasedCoords: [...s.purchasedCoords, coord],
                tileCategories: { ...s.tileCategories, [key]: category },
            }
            if (category === 'structure') {
                return {
                    ...base,
                    buildingSlots: [...s.buildingSlots, ...makeStructureSlots(coord)],
                }
            }
            const cropType = subcategory as CropType
            return {
                ...base,
                plots: [...s.plots, ...makePlots(coord, cropType)],
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
