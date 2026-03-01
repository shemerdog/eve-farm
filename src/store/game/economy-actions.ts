import { TileCategory, CropType } from '@/types'
import type { TileCoord, TileSubcategory } from '@/types'
import { SELL_BULK_SIZE, SELL_PRICE, calcTilePrice } from '@/game/constants'
import { FARM_COORD, isAdjacentToUnlocked, isPurchased } from '@/game/world-map'
import type { GameActions, SetState } from './store-types'
import { initialState, makePlots, makeStructureSlots } from './state'

const CROP_KEY: Record<CropType, 'wheat' | 'barley' | 'grapes'> = {
    [CropType.Wheat]: 'wheat',
    [CropType.Barley]: 'barley',
    [CropType.Grapes]: 'grapes',
}

export const createEconomyActions = (
    set: SetState,
): Pick<GameActions, 'buyTile' | 'sellCrops' | 'resetGame'> => ({
    buyTile: (coord: TileCoord, category: TileCategory, subcategory: TileSubcategory): void => {
        set((s) => {
            const price = calcTilePrice(s.purchasedCoords.length)
            if (
                s.shekels < price ||
                !isAdjacentToUnlocked(coord, s.purchasedCoords) ||
                isPurchased(coord, s.purchasedCoords)
            )
                return s
            const key = `${coord.col}_${coord.row}`
            const base = {
                shekels: Math.max(0, s.shekels - price),
                purchasedCoords: [...s.purchasedCoords, coord],
                tileCategories: { ...s.tileCategories, [key]: category },
            }
            if (category === TileCategory.Structure) {
                return {
                    ...base,
                    buildingSlots: [...s.buildingSlots, ...makeStructureSlots(coord)],
                }
            }
            const cropType = subcategory as unknown as CropType
            return {
                ...base,
                plots: [...s.plots, ...makePlots(coord, cropType)],
            }
        })
    },

    sellCrops: (cropType: CropType): void => {
        set((s) => {
            const key = CROP_KEY[cropType]
            if (s[key] < SELL_BULK_SIZE) return s
            return {
                [key]: s[key] - SELL_BULK_SIZE,
                shekels: s.shekels + SELL_BULK_SIZE * SELL_PRICE[cropType],
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
