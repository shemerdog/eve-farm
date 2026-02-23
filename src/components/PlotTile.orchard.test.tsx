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
