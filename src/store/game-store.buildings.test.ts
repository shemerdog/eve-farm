import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './game-store'
import { resetGameStore } from '@/test-utils/game-store'
import { BUILDING_SLOT_COUNT } from '@/game/constants'
import { TileCategory, TileSubcategory, BuildingType } from '@/types'

beforeEach(() => {
    resetGameStore()
})

describe('buyTile("structure", "structure")', () => {
    it('creates building slots for the purchased coord', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 } // adjacent to default farm at (2,2)

        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        const state = useGameStore.getState()
        const slots = state.buildingSlots.filter(
            (s) => s.tileCoord.col === coord.col && s.tileCoord.row === coord.row,
        )
        expect(slots.length).toBe(BUILDING_SLOT_COUNT)
    })

    it('sets tileCategories to "structure" for the purchased coord', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }

        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        const key = `${coord.col}_${coord.row}`
        expect(useGameStore.getState().tileCategories[key]).toBe(TileCategory.Structure)
    })

    it('all created slots have state "empty" and buildingType null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }

        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        const slots = useGameStore
            .getState()
            .buildingSlots.filter(
                (s) => s.tileCoord.col === coord.col && s.tileCoord.row === coord.row,
            )
        slots.forEach((slot) => {
            expect(slot.state).toBe('empty')
            expect(slot.buildingType).toBeNull()
        })
    })

    it('does NOT create crop plots for a structure tile', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        const plotsBefore = useGameStore.getState().plots.length

        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        expect(useGameStore.getState().plots.length).toBe(plotsBefore)
    })

    it('slot IDs follow the s{col}_{row}_{i} format', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }

        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        const slots = useGameStore
            .getState()
            .buildingSlots.filter(
                (s) => s.tileCoord.col === coord.col && s.tileCoord.row === coord.row,
            )
        slots.forEach((slot, i) => {
            expect(slot.id).toBe(`s${coord.col}_${coord.row}_${i}`)
        })
    })
})

describe('buildStructure', () => {
    it('sets buildingType and state "built" on an empty slot', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        const slotId = `s${coord.col}_${coord.row}_0`
        useGameStore.getState().buildStructure(slotId, BuildingType.Farmhouse)

        const slot = useGameStore.getState().buildingSlots.find((s) => s.id === slotId)!
        expect(slot.state).toBe('built')
        expect(slot.buildingType).toBe(BuildingType.Farmhouse)
    })

    it('is a no-op on an already-built slot', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        const slotId = `s${coord.col}_${coord.row}_0`
        useGameStore.getState().buildStructure(slotId, BuildingType.Farmhouse)
        useGameStore.getState().buildStructure(slotId, BuildingType.Barn) // should not overwrite

        const slot = useGameStore.getState().buildingSlots.find((s) => s.id === slotId)!
        expect(slot.buildingType).toBe(BuildingType.Farmhouse) // unchanged
    })

    it('is a no-op with an unknown slotId', () => {
        const slotsBefore = useGameStore.getState().buildingSlots
        useGameStore.getState().buildStructure('nonexistent_slot', BuildingType.Barn)
        expect(useGameStore.getState().buildingSlots).toBe(slotsBefore) // same reference
    })

    it('only modifies the targeted slot, leaving others unchanged', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        const slotId = `s${coord.col}_${coord.row}_0`
        useGameStore.getState().buildStructure(slotId, BuildingType.Barn)

        const otherSlots = useGameStore
            .getState()
            .buildingSlots.filter((s) => s.id !== slotId)
        otherSlots.forEach((slot) => {
            expect(slot.state).toBe('empty')
            expect(slot.buildingType).toBeNull()
        })
    })

    it('can build different building types in different slots', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Structure, TileSubcategory.Structure)

        useGameStore.getState().buildStructure(`s${coord.col}_${coord.row}_0`, BuildingType.Farmhouse)
        useGameStore.getState().buildStructure(`s${coord.col}_${coord.row}_1`, BuildingType.Barn)
        useGameStore.getState().buildStructure(`s${coord.col}_${coord.row}_2`, BuildingType.Sheepfold)
        useGameStore.getState().buildStructure(`s${coord.col}_${coord.row}_3`, BuildingType.Silo)

        const slots = useGameStore
            .getState()
            .buildingSlots.filter(
                (s) => s.tileCoord.col === coord.col && s.tileCoord.row === coord.row,
            )
        expect(slots[0].buildingType).toBe(BuildingType.Farmhouse)
        expect(slots[1].buildingType).toBe(BuildingType.Barn)
        expect(slots[2].buildingType).toBe(BuildingType.Sheepfold)
        expect(slots[3].buildingType).toBe(BuildingType.Silo)
    })
})
