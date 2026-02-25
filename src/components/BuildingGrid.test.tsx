import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { BuildingGrid } from './BuildingGrid'
import { useGameStore } from '@/store/game-store'
import { resetGameStore } from '@/test-utils/game-store'
import { HE } from '@/game/strings.he'
import { makeStructureSlots } from '@/store/game/state'
import { BUILDING_SLOT_COUNT } from '@/game/constants'

const COORD = { col: 2, row: 1 }
const OTHER_COORD = { col: 3, row: 2 }

beforeEach(() => {
    resetGameStore()
})

describe('BuildingGrid', () => {
    it('renders BUILDING_SLOT_COUNT empty slot tiles for the matching coord', () => {
        useGameStore.setState({ buildingSlots: makeStructureSlots(COORD) })
        render(<BuildingGrid tileCoord={COORD} />)
        const btns = screen.getAllByRole('button', { name: HE.buildings.emptySlotLabel })
        expect(btns).toHaveLength(BUILDING_SLOT_COUNT)
    })

    it('renders no slots for a different coord', () => {
        useGameStore.setState({ buildingSlots: makeStructureSlots(COORD) })
        render(<BuildingGrid tileCoord={OTHER_COORD} />)
        expect(
            screen.queryByRole('button', { name: HE.buildings.emptySlotLabel }),
        ).not.toBeInTheDocument()
    })

    it('renders only the slots for the given coord when multiple tiles exist', () => {
        useGameStore.setState({
            buildingSlots: [...makeStructureSlots(COORD), ...makeStructureSlots(OTHER_COORD)],
        })
        render(<BuildingGrid tileCoord={COORD} />)
        const btns = screen.getAllByRole('button', { name: HE.buildings.emptySlotLabel })
        expect(btns).toHaveLength(BUILDING_SLOT_COUNT)
    })

    it('renders a built slot by its building name', () => {
        const slots = makeStructureSlots(COORD)
        slots[0] = { ...slots[0], buildingType: 'barn', state: 'built' }
        useGameStore.setState({ buildingSlots: slots })
        render(<BuildingGrid tileCoord={COORD} />)
        expect(screen.getByText(HE.buildings.barn)).toBeInTheDocument()
    })
})
