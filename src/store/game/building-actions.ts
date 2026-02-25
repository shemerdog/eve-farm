import type { BuildingType } from '@/types'
import type { GameActions, SetState } from './store-types'

export const createBuildingActions = (set: SetState): Pick<GameActions, 'buildStructure'> => ({
    buildStructure: (slotId: string, buildingType: BuildingType): void => {
        set((s) => {
            const slot = s.buildingSlots.find((sl) => sl.id === slotId)
            if (!slot || slot.state !== 'empty') return s
            return {
                buildingSlots: s.buildingSlots.map((sl) =>
                    sl.id === slotId ? { ...sl, buildingType, state: 'built' as const } : sl,
                ),
            }
        })
    },
})
