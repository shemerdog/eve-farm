import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { PlotTile } from './PlotTile'
import type { Plot } from '@/types'

const mockPlantWheat = vi.fn()
const mockHarvest = vi.fn()
const mockPlowPlot = vi.fn()
const mockGatherSheafs = vi.fn()
const mockPlantOrchard = vi.fn()
const mockFertilizePlot = vi.fn()
const mockTendPlot = vi.fn()
const mockThinShoots = vi.fn()

vi.mock('@/store/game-store', () => ({
    useGameStore: (selector: (s: object) => unknown): unknown =>
        selector({
            plantWheat: mockPlantWheat,
            harvest: mockHarvest,
            plowPlot: mockPlowPlot,
            gatherSheafs: mockGatherSheafs,
            plantOrchard: mockPlantOrchard,
            fertilizePlot: mockFertilizePlot,
            tendPlot: mockTendPlot,
            thinShoots: mockThinShoots,
        }),
}))

const coord = { col: 2, row: 2 }
const emptyPlot: Plot = {
    id: '2_2_0',
    state: 'empty',
    plantedAt: null,
    growthDuration: 15000,
    tileCoord: coord,
    cropType: 'wheat',
    hasBeenPlanted: false,
    nextActionAt: null,
    harvestCount: 0,
}
const plowedPlot: Plot = {
    id: '2_2_4',
    state: 'plowed',
    plantedAt: null,
    growthDuration: 15000,
    tileCoord: coord,
    cropType: 'wheat',
    hasBeenPlanted: false,
    nextActionAt: null,
    harvestCount: 0,
}
const growingPlot: Plot = {
    id: '2_2_1',
    state: 'growing',
    plantedAt: Date.now(),
    growthDuration: 15000,
    tileCoord: coord,
    cropType: 'wheat',
    hasBeenPlanted: false,
    nextActionAt: null,
    harvestCount: 0,
}
const readyPlot: Plot = {
    id: '2_2_2',
    state: 'ready',
    plantedAt: Date.now() - 15001,
    growthDuration: 15000,
    tileCoord: coord,
    cropType: 'wheat',
    hasBeenPlanted: false,
    nextActionAt: null,
    harvestCount: 0,
}
const harvestedPlot: Plot = {
    id: '2_2_3',
    state: 'harvested',
    plantedAt: null,
    growthDuration: 15000,
    tileCoord: coord,
    cropType: 'wheat',
    hasBeenPlanted: false,
    nextActionAt: null,
    harvestCount: 0,
}
const gatheredPlot: Plot = {
    id: '2_2_5',
    state: 'gathered',
    plantedAt: null,
    growthDuration: 15000,
    tileCoord: coord,
    cropType: 'wheat',
    hasBeenPlanted: false,
    nextActionAt: null,
    harvestCount: 0,
}

beforeEach((): void => {
    mockPlantWheat.mockReset()
    mockHarvest.mockReset()
    mockPlowPlot.mockReset()
    mockGatherSheafs.mockReset()
    mockPlantOrchard.mockReset()
    mockFertilizePlot.mockReset()
    mockTendPlot.mockReset()
    mockThinShoots.mockReset()
})

describe('PlotTile — plow', () => {
    test('renders plow button when empty', (): void => {
        render(<PlotTile plot={emptyPlot} />)
        expect(screen.getByRole('button', { name: 'חֲרֹשׁ' })).toBeInTheDocument()
    })

    test('clicking the plow button calls plowPlot with the plot id', async (): Promise<void> => {
        render(<PlotTile plot={emptyPlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'חֲרֹשׁ' }))
        expect(mockPlowPlot).toHaveBeenCalledOnce()
        expect(mockPlowPlot).toHaveBeenCalledWith('2_2_0')
    })

    test('does not render plow button when plowed', (): void => {
        render(<PlotTile plot={plowedPlot} />)
        expect(screen.queryByRole('button', { name: 'חֲרֹשׁ' })).not.toBeInTheDocument()
    })

    test('does not render plow button when growing', (): void => {
        render(<PlotTile plot={growingPlot} />)
        expect(screen.queryByRole('button', { name: 'חֲרֹשׁ' })).not.toBeInTheDocument()
    })
})

describe('PlotTile — sow', () => {
    test('renders sow button when plowed', (): void => {
        render(<PlotTile plot={plowedPlot} />)
        expect(screen.getByRole('button', { name: 'זְרַע' })).toBeInTheDocument()
    })

    test('clicking the sow button calls plantWheat with the plot id', async (): Promise<void> => {
        render(<PlotTile plot={plowedPlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'זְרַע' }))
        expect(mockPlantWheat).toHaveBeenCalledOnce()
        expect(mockPlantWheat).toHaveBeenCalledWith('2_2_4')
    })

    test('does not render sow button when empty', (): void => {
        render(<PlotTile plot={emptyPlot} />)
        expect(screen.queryByRole('button', { name: 'זְרַע' })).not.toBeInTheDocument()
    })

    test('does not render sow button when growing', (): void => {
        render(<PlotTile plot={growingPlot} />)
        expect(screen.queryByRole('button', { name: 'זְרַע' })).not.toBeInTheDocument()
    })
})

describe('PlotTile — harvest', () => {
    test('renders harvest button when ready', (): void => {
        render(<PlotTile plot={readyPlot} />)
        expect(screen.getByRole('button', { name: 'קְצֹר' })).toBeInTheDocument()
    })

    test('clicking the harvest button calls harvest with the plot id', async (): Promise<void> => {
        render(<PlotTile plot={readyPlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'קְצֹר' }))
        expect(mockHarvest).toHaveBeenCalledOnce()
        expect(mockHarvest).toHaveBeenCalledWith('2_2_2')
    })

    test('does not render harvest button when harvested', (): void => {
        render(<PlotTile plot={harvestedPlot} />)
        expect(screen.queryByRole('button', { name: 'קְצֹר' })).not.toBeInTheDocument()
    })
})

describe('PlotTile — gather', () => {
    test('renders gather button when gathered', (): void => {
        render(<PlotTile plot={gatheredPlot} />)
        expect(screen.getByRole('button', { name: 'אֱסֹף' })).toBeInTheDocument()
    })

    test('clicking the gather button calls gatherSheafs with the plot id', async (): Promise<void> => {
        render(<PlotTile plot={gatheredPlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'אֱסֹף' }))
        expect(mockGatherSheafs).toHaveBeenCalledOnce()
        expect(mockGatherSheafs).toHaveBeenCalledWith('2_2_5')
    })

    test('does not render gather button when ready', (): void => {
        render(<PlotTile plot={readyPlot} />)
        expect(screen.queryByRole('button', { name: 'אֱסֹף' })).not.toBeInTheDocument()
    })

    test('does not render gather button when empty', (): void => {
        render(<PlotTile plot={emptyPlot} />)
        expect(screen.queryByRole('button', { name: 'אֱסֹף' })).not.toBeInTheDocument()
    })
})

describe('PlotTile — stage colors', () => {
    test("empty plot has data-state='empty'", (): void => {
        const { container } = render(<PlotTile plot={emptyPlot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'empty')
    })

    test("plowed plot has data-state='plowed'", (): void => {
        const { container } = render(<PlotTile plot={plowedPlot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'plowed')
    })

    test("growing plot has data-state='growing'", (): void => {
        const { container } = render(<PlotTile plot={growingPlot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'growing')
    })

    test("ready plot has data-state='ready'", (): void => {
        const { container } = render(<PlotTile plot={readyPlot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'ready')
    })

    test("harvested plot has data-state='harvested'", (): void => {
        const { container } = render(<PlotTile plot={harvestedPlot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'harvested')
    })

    test("gathered plot has data-state='gathered'", (): void => {
        const { container } = render(<PlotTile plot={gatheredPlot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'gathered')
    })
})

describe('PlotTile — no spurious calls', () => {
    test('clicking growing plot does not call any action', async (): Promise<void> => {
        render(<PlotTile plot={growingPlot} />)
        const tile = screen.getByText('🌱').closest('div')!
        await userEvent.click(tile)
        expect(mockPlowPlot).not.toHaveBeenCalled()
        expect(mockPlantWheat).not.toHaveBeenCalled()
        expect(mockHarvest).not.toHaveBeenCalled()
    })
})

describe('PlotTile — barley crop type', () => {
    const barleyReadyPlot: Plot = {
        id: '2_1_0',
        state: 'ready',
        plantedAt: Date.now() - 20001,
        growthDuration: 20000,
        tileCoord: { col: 2, row: 1 },
        cropType: 'barley',
        hasBeenPlanted: false,
        nextActionAt: null,
        harvestCount: 0,
    }
    const barleyGatheredPlot: Plot = {
        id: '2_1_1',
        state: 'gathered',
        plantedAt: null,
        growthDuration: 20000,
        tileCoord: { col: 2, row: 1 },
        cropType: 'barley',
        hasBeenPlanted: false,
        nextActionAt: null,
        harvestCount: 0,
    }

    test('barley ready plot shows grain sheaf emoji', (): void => {
        render(<PlotTile plot={barleyReadyPlot} />)
        expect(screen.getByText('🌾')).toBeInTheDocument()
    })

    test('barley gathered plot shows sheaves emoji', (): void => {
        render(<PlotTile plot={barleyGatheredPlot} />)
        expect(screen.getByText('🌾')).toBeInTheDocument()
    })
})

// ── Orchard cycle tests ──────────────────────────────────────────────────────

