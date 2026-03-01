import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { BuildingSlotTile } from './BuildingSlotTile'
import type { BuildingSlot } from '@/types'
import { BuildingType } from '@/types'
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
            screen.getByRole('button', { name: new RegExp(HE.buildings.Farmhouse) }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: new RegExp(HE.buildings.Barn) }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: new RegExp(HE.buildings.Sheepfold) }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: new RegExp(HE.buildings.Silo) }),
        ).toBeInTheDocument()
    })

    it('selecting farmhouse calls buildStructure and slot becomes built', async () => {
        useGameStore.setState({ buildingSlots: [{ ...EMPTY_SLOT }] })
        render(<BuildingSlotTile slot={EMPTY_SLOT} />)
        await userEvent.click(screen.getByRole('button', { name: HE.buildings.emptySlotLabel }))
        await userEvent.click(
            screen.getByRole('button', { name: new RegExp(HE.buildings.Farmhouse) }),
        )
        const slot = useGameStore.getState().buildingSlots.find((s) => s.id === EMPTY_SLOT.id)!
        expect(slot.state).toBe('built')
        expect(slot.buildingType).toBe(BuildingType.Farmhouse)
    })

    it('selecting barn calls buildStructure with "barn"', async () => {
        useGameStore.setState({ buildingSlots: [{ ...EMPTY_SLOT }] })
        render(<BuildingSlotTile slot={EMPTY_SLOT} />)
        await userEvent.click(screen.getByRole('button', { name: HE.buildings.emptySlotLabel }))
        await userEvent.click(screen.getByRole('button', { name: new RegExp(HE.buildings.Barn) }))
        const slot = useGameStore.getState().buildingSlots.find((s) => s.id === EMPTY_SLOT.id)!
        expect(slot.buildingType).toBe(BuildingType.Barn)
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
            buildingType: BuildingType.Farmhouse,
            state: 'built',
        }
        render(<BuildingSlotTile slot={slot} />)
        expect(screen.getByText(HE.buildings.Farmhouse)).toBeInTheDocument()
    })

    it('renders the building name for barn', () => {
        const slot: BuildingSlot = {
            ...EMPTY_SLOT,
            buildingType: BuildingType.Barn,
            state: 'built',
        }
        render(<BuildingSlotTile slot={slot} />)
        expect(screen.getByText(HE.buildings.Barn)).toBeInTheDocument()
    })

    it('renders the building name for sheepfold', () => {
        const slot: BuildingSlot = {
            ...EMPTY_SLOT,
            buildingType: BuildingType.Sheepfold,
            state: 'built',
        }
        render(<BuildingSlotTile slot={slot} />)
        expect(screen.getByText(HE.buildings.Sheepfold)).toBeInTheDocument()
    })

    it('renders the building name for silo', () => {
        const slot: BuildingSlot = {
            ...EMPTY_SLOT,
            buildingType: BuildingType.Silo,
            state: 'built',
        }
        render(<BuildingSlotTile slot={slot} />)
        expect(screen.getByText(HE.buildings.Silo)).toBeInTheDocument()
    })

    it('does not render the build button when slot is built', () => {
        const slot: BuildingSlot = {
            ...EMPTY_SLOT,
            buildingType: BuildingType.Silo,
            state: 'built',
        }
        render(<BuildingSlotTile slot={slot} />)
        expect(
            screen.queryByRole('button', { name: HE.buildings.emptySlotLabel }),
        ).not.toBeInTheDocument()
    })
})
