import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { BuildingSlotTile } from './BuildingSlotTile'
import type { BuildingSlot } from '@/types'
import { useGameStore } from '@/store/game-store'
import { resetGameStore } from '@/test-utils/game-store'
import { HE } from '@/game/strings.he'

const EMPTY_SLOT: BuildingSlot = {
    id: 's2_1_0',
    tileCoord: { col: 2, row: 1 },
    buildingType: null,
    state: 'empty',
}

beforeEach(() => {
    resetGameStore()
})

describe('BuildingSlotTile — empty slot', () => {
    it('renders the build button with Hebrew label', () => {
        render(<BuildingSlotTile slot={EMPTY_SLOT} />)
        expect(
            screen.getByRole('button', { name: HE.buildings.emptySlotLabel }),
        ).toBeInTheDocument()
    })

    it('clicking build button shows all four building type options', async () => {
        render(<BuildingSlotTile slot={EMPTY_SLOT} />)
        await userEvent.click(screen.getByRole('button', { name: HE.buildings.emptySlotLabel }))
        expect(
            screen.getByRole('button', { name: new RegExp(HE.buildings.farmhouse) }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: new RegExp(HE.buildings.barn) }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: new RegExp(HE.buildings.sheepfold) }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: new RegExp(HE.buildings.silo) }),
        ).toBeInTheDocument()
    })

    it('selecting farmhouse calls buildStructure and slot becomes built', async () => {
        useGameStore.setState({ buildingSlots: [{ ...EMPTY_SLOT }] })
        render(<BuildingSlotTile slot={EMPTY_SLOT} />)
        await userEvent.click(screen.getByRole('button', { name: HE.buildings.emptySlotLabel }))
        await userEvent.click(
            screen.getByRole('button', { name: new RegExp(HE.buildings.farmhouse) }),
        )
        const slot = useGameStore.getState().buildingSlots.find((s) => s.id === EMPTY_SLOT.id)!
        expect(slot.state).toBe('built')
        expect(slot.buildingType).toBe('farmhouse')
    })

    it('selecting barn calls buildStructure with "barn"', async () => {
        useGameStore.setState({ buildingSlots: [{ ...EMPTY_SLOT }] })
        render(<BuildingSlotTile slot={EMPTY_SLOT} />)
        await userEvent.click(screen.getByRole('button', { name: HE.buildings.emptySlotLabel }))
        await userEvent.click(
            screen.getByRole('button', { name: new RegExp(HE.buildings.barn) }),
        )
        const slot = useGameStore.getState().buildingSlots.find((s) => s.id === EMPTY_SLOT.id)!
        expect(slot.buildingType).toBe('barn')
    })

    it('back button in picking mode returns to build button without building', async () => {
        render(<BuildingSlotTile slot={EMPTY_SLOT} />)
        await userEvent.click(screen.getByRole('button', { name: HE.buildings.emptySlotLabel }))
        await userEvent.click(screen.getByRole('button', { name: /←|חזור/i }))
        expect(
            screen.getByRole('button', { name: HE.buildings.emptySlotLabel }),
        ).toBeInTheDocument()
    })
})

describe('BuildingSlotTile — built slot', () => {
    it('renders the building name for farmhouse', () => {
        const slot: BuildingSlot = {
            ...EMPTY_SLOT,
            buildingType: 'farmhouse',
            state: 'built',
        }
        render(<BuildingSlotTile slot={slot} />)
        expect(screen.getByText(HE.buildings.farmhouse)).toBeInTheDocument()
    })

    it('renders the building name for barn', () => {
        const slot: BuildingSlot = { ...EMPTY_SLOT, buildingType: 'barn', state: 'built' }
        render(<BuildingSlotTile slot={slot} />)
        expect(screen.getByText(HE.buildings.barn)).toBeInTheDocument()
    })

    it('renders the building name for sheepfold', () => {
        const slot: BuildingSlot = { ...EMPTY_SLOT, buildingType: 'sheepfold', state: 'built' }
        render(<BuildingSlotTile slot={slot} />)
        expect(screen.getByText(HE.buildings.sheepfold)).toBeInTheDocument()
    })

    it('renders the building name for silo', () => {
        const slot: BuildingSlot = { ...EMPTY_SLOT, buildingType: 'silo', state: 'built' }
        render(<BuildingSlotTile slot={slot} />)
        expect(screen.getByText(HE.buildings.silo)).toBeInTheDocument()
    })

    it('does not render the build button when slot is built', () => {
        const slot: BuildingSlot = { ...EMPTY_SLOT, buildingType: 'silo', state: 'built' }
        render(<BuildingSlotTile slot={slot} />)
        expect(
            screen.queryByRole('button', { name: HE.buildings.emptySlotLabel }),
        ).not.toBeInTheDocument()
    })
})
