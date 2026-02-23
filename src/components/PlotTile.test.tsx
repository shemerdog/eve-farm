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

vi.mock('@/store/gameStore', () => ({
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

describe('PlotTile — orchard first cycle (grapes, hasBeenPlanted=false)', () => {
    const grapeCoord = { col: 3, row: 2 }

    const emptyGrapePlot: Plot = {
        id: '3_2_0',
        state: 'empty',
        plantedAt: null,
        growthDuration: 30000,
        tileCoord: grapeCoord,
        cropType: 'grapes',
        hasBeenPlanted: false,
        nextActionAt: null,
        harvestCount: 0,
    }

    test('renders שְׁתוֹל button on empty orchard (first cycle)', (): void => {
        render(<PlotTile plot={emptyGrapePlot} />)
        expect(screen.getByRole('button', { name: 'שְׁתוֹל' })).toBeInTheDocument()
    })

    test('clicking empty orchard (first cycle) calls plantOrchard', async (): Promise<void> => {
        render(<PlotTile plot={emptyGrapePlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'שְׁתוֹל' }))
        expect(mockPlantOrchard).toHaveBeenCalledOnce()
        expect(mockPlantOrchard).toHaveBeenCalledWith('3_2_0')
        expect(mockPlowPlot).not.toHaveBeenCalled()
    })

    const plantedPlot: Plot = {
        id: '3_2_0',
        state: 'planted',
        plantedAt: null,
        growthDuration: 30000,
        tileCoord: grapeCoord,
        cropType: 'grapes',
        hasBeenPlanted: true,
        nextActionAt: null,
        harvestCount: 0,
    }

    test('renders דַּשֵּׁן button when planted', (): void => {
        render(<PlotTile plot={plantedPlot} />)
        expect(screen.getByRole('button', { name: 'דַּשֵּׁן' })).toBeInTheDocument()
    })

    test('clicking planted orchard calls fertilizePlot', async (): Promise<void> => {
        render(<PlotTile plot={plantedPlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'דַּשֵּׁן' }))
        expect(mockFertilizePlot).toHaveBeenCalledOnce()
        expect(mockFertilizePlot).toHaveBeenCalledWith('3_2_0')
    })

    const fertilizedPlot: Plot = {
        id: '3_2_0',
        state: 'fertilized',
        plantedAt: null,
        growthDuration: 30000,
        tileCoord: grapeCoord,
        cropType: 'grapes',
        hasBeenPlanted: true,
        nextActionAt: null,
        harvestCount: 0,
    }

    test('renders זְמֹר button when fertilized', (): void => {
        render(<PlotTile plot={fertilizedPlot} />)
        expect(screen.getByRole('button', { name: 'זְמֹר' })).toBeInTheDocument()
    })

    test('clicking fertilized orchard calls tendPlot', async (): Promise<void> => {
        render(<PlotTile plot={fertilizedPlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'זְמֹר' }))
        expect(mockTendPlot).toHaveBeenCalledOnce()
        expect(mockTendPlot).toHaveBeenCalledWith('3_2_0')
    })

    const tendedPlot: Plot = {
        id: '3_2_0',
        state: 'tended',
        plantedAt: null,
        growthDuration: 30000,
        tileCoord: grapeCoord,
        cropType: 'grapes',
        hasBeenPlanted: true,
        nextActionAt: null,
        harvestCount: 0,
    }

    test('renders דַּלֵּל button when tended (grapes)', (): void => {
        render(<PlotTile plot={tendedPlot} />)
        expect(screen.getByRole('button', { name: 'דַּלֵּל' })).toBeInTheDocument()
    })

    test('clicking tended grape plot calls thinShoots', async (): Promise<void> => {
        render(<PlotTile plot={tendedPlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'דַּלֵּל' }))
        expect(mockThinShoots).toHaveBeenCalledOnce()
        expect(mockThinShoots).toHaveBeenCalledWith('3_2_0')
    })

    const readyGrapePlot: Plot = {
        id: '3_2_0',
        state: 'ready',
        plantedAt: null,
        growthDuration: 30000,
        tileCoord: grapeCoord,
        cropType: 'grapes',
        hasBeenPlanted: true,
        nextActionAt: null,
        harvestCount: 0,
    }

    test('renders בְּצֹר button when grapes are ready', (): void => {
        render(<PlotTile plot={readyGrapePlot} />)
        expect(screen.getByRole('button', { name: 'בְּצֹר' })).toBeInTheDocument()
    })

    test('clicking ready grape plot calls harvest', async (): Promise<void> => {
        render(<PlotTile plot={readyGrapePlot} />)
        await userEvent.click(screen.getByRole('button', { name: 'בְּצֹר' }))
        expect(mockHarvest).toHaveBeenCalledOnce()
        expect(mockHarvest).toHaveBeenCalledWith('3_2_0')
    })
})

describe('PlotTile — orchard subsequent cycle (grapes, hasBeenPlanted=true)', () => {
    const grapeCoord = { col: 3, row: 2 }

    const emptyGrapeReturning: Plot = {
        id: '3_2_1',
        state: 'empty',
        plantedAt: null,
        growthDuration: 30000,
        tileCoord: grapeCoord,
        cropType: 'grapes',
        hasBeenPlanted: true,
        nextActionAt: null,
        harvestCount: 0,
    }

    test('renders דַּשֵּׁן button on empty orchard (subsequent cycle)', (): void => {
        render(<PlotTile plot={emptyGrapeReturning} />)
        expect(screen.getByRole('button', { name: 'דַּשֵּׁן' })).toBeInTheDocument()
    })

    test('clicking empty orchard (subsequent cycle) calls fertilizePlot', async (): Promise<void> => {
        render(<PlotTile plot={emptyGrapeReturning} />)
        await userEvent.click(screen.getByRole('button', { name: 'דַּשֵּׁן' }))
        expect(mockFertilizePlot).toHaveBeenCalledOnce()
        expect(mockFertilizePlot).toHaveBeenCalledWith('3_2_1')
        expect(mockPlantOrchard).not.toHaveBeenCalled()
        expect(mockPlowPlot).not.toHaveBeenCalled()
    })
})

describe('PlotTile — data-state for new orchard states', () => {
    const grapeCoord = { col: 3, row: 2 }

    test("planted plot has data-state='planted'", (): void => {
        const plot: Plot = {
            id: '3_2_0',
            state: 'planted',
            plantedAt: null,
            growthDuration: 30000,
            tileCoord: grapeCoord,
            cropType: 'grapes',
            hasBeenPlanted: true,
            nextActionAt: null,
            harvestCount: 0,
        }
        const { container } = render(<PlotTile plot={plot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'planted')
    })

    test("fertilized plot has data-state='fertilized'", (): void => {
        const plot: Plot = {
            id: '3_2_0',
            state: 'fertilized',
            plantedAt: null,
            growthDuration: 30000,
            tileCoord: grapeCoord,
            cropType: 'grapes',
            hasBeenPlanted: true,
            nextActionAt: null,
            harvestCount: 0,
        }
        const { container } = render(<PlotTile plot={plot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'fertilized')
    })

    test("tended plot has data-state='tended'", (): void => {
        const plot: Plot = {
            id: '3_2_0',
            state: 'tended',
            plantedAt: null,
            growthDuration: 30000,
            tileCoord: grapeCoord,
            cropType: 'grapes',
            hasBeenPlanted: true,
            nextActionAt: null,
            harvestCount: 0,
        }
        const { container } = render(<PlotTile plot={plot} />)
        expect(container.firstElementChild).toHaveAttribute('data-state', 'tended')
    })
})

// ── nextActionAt: disabled buttons + countdown ───────────────────────────────

describe('PlotTile — nextActionAt countdown / disabled buttons', () => {
    const grapeCoord = { col: 3, row: 2 }
    const futureTime = Date.now() + 8000

    const fertilizedLocked: Plot = {
        id: '3_2_0',
        state: 'fertilized',
        plantedAt: null,
        growthDuration: 30000,
        tileCoord: grapeCoord,
        cropType: 'grapes',
        hasBeenPlanted: true,
        nextActionAt: futureTime,
        harvestCount: 0,
    }

    const tendedLocked: Plot = {
        id: '3_2_0',
        state: 'tended',
        plantedAt: null,
        growthDuration: 30000,
        tileCoord: grapeCoord,
        cropType: 'grapes',
        hasBeenPlanted: true,
        nextActionAt: futureTime,
        harvestCount: 0,
    }

    test('Tend button is disabled when nextActionAt is pending', (): void => {
        render(<PlotTile plot={fertilizedLocked} />)
        const btn = screen.getByRole('button', { name: /זְמֹר/ })
        expect(btn).toBeDisabled()
    })

    test('Tend button shows countdown when locked', (): void => {
        render(<PlotTile plot={fertilizedLocked} />)
        const btn = screen.getByRole('button', { name: /זְמֹר/ })
        expect(btn.textContent).toMatch(/\d+s/)
    })

    test('clicking locked fertilized tile does not call tendPlot', async (): Promise<void> => {
        render(<PlotTile plot={fertilizedLocked} />)
        // Click the tile div (parent of the disabled button)
        const tile = screen.getByRole('button', { name: /זְמֹר/ }).closest('[data-state]')!
        await userEvent.click(tile)
        expect(mockTendPlot).not.toHaveBeenCalled()
    })

    test('Thin Shoots button is disabled when nextActionAt is pending', (): void => {
        render(<PlotTile plot={tendedLocked} />)
        const btn = screen.getByRole('button', { name: /דַּלֵּל/ })
        expect(btn).toBeDisabled()
    })

    test('Thin Shoots button shows countdown when locked', (): void => {
        render(<PlotTile plot={tendedLocked} />)
        const btn = screen.getByRole('button', { name: /דַּלֵּל/ })
        expect(btn.textContent).toMatch(/\d+s/)
    })

    test('clicking locked tended tile does not call thinShoots', async (): Promise<void> => {
        render(<PlotTile plot={tendedLocked} />)
        const tile = screen.getByRole('button', { name: /דַּלֵּל/ }).closest('[data-state]')!
        await userEvent.click(tile)
        expect(mockThinShoots).not.toHaveBeenCalled()
    })
})
