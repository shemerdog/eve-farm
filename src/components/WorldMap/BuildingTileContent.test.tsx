import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { BuildingTileContent } from './BuildingTileContent'
import { useGameStore } from '@/store/game-store'
import { resetGameStore } from '@/test-utils/game-store'
import { HE } from '@/game/strings.he'
import { makeStructureSlots } from '@/store/game/state'
import { BUILDING_SLOT_COUNT } from '@/game/constants'

const COORD = { col: 2, row: 1 }

beforeEach(() => {
    resetGameStore()
})

describe('BuildingTileContent', () => {
    it('renders all building slot tiles for the coord', () => {
        useGameStore.setState({ buildingSlots: makeStructureSlots(COORD) })
        render(<BuildingTileContent tileCoord={COORD} />)
        const btns = screen.getAllByRole('button', { name: HE.buildings.emptySlotLabel })
        expect(btns).toHaveLength(BUILDING_SLOT_COUNT)
    })
})
