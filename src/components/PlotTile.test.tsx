import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { PlotTile } from './PlotTile'
import type { Plot } from '@/types'

const mockPlantWheat = vi.fn()
const mockHarvest = vi.fn()

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (s: object) => unknown) =>
    selector({ plantWheat: mockPlantWheat, harvest: mockHarvest }),
}))

const coord = { col: 2, row: 2 }
const emptyPlot: Plot = { id: '2_2_0', state: 'empty', plantedAt: null, growthDuration: 15000, tileCoord: coord }
const growingPlot: Plot = { id: '2_2_1', state: 'growing', plantedAt: Date.now(), growthDuration: 15000, tileCoord: coord }
const readyPlot: Plot = { id: '2_2_2', state: 'ready', plantedAt: Date.now() - 15001, growthDuration: 15000, tileCoord: coord }
const harvestedPlot: Plot = { id: '2_2_3', state: 'harvested', plantedAt: null, growthDuration: 15000, tileCoord: coord }

beforeEach(() => {
  mockPlantWheat.mockReset()
  mockHarvest.mockReset()
})

describe('PlotTile — sow', () => {
  test('renders sow button when empty', () => {
    render(<PlotTile plot={emptyPlot} />)
    expect(screen.getByRole('button', { name: 'זְרַע' })).toBeInTheDocument()
  })

  test('clicking the sow button calls plantWheat with the plot id', async () => {
    render(<PlotTile plot={emptyPlot} />)
    await userEvent.click(screen.getByRole('button', { name: 'זְרַע' }))
    expect(mockPlantWheat).toHaveBeenCalledOnce()
    expect(mockPlantWheat).toHaveBeenCalledWith('2_2_0')
  })

  test('does not render sow button when growing', () => {
    render(<PlotTile plot={growingPlot} />)
    expect(screen.queryByRole('button', { name: 'זְרַע' })).not.toBeInTheDocument()
  })
})

describe('PlotTile — harvest', () => {
  test('renders harvest button when ready', () => {
    render(<PlotTile plot={readyPlot} />)
    expect(screen.getByRole('button', { name: 'קְצֹר' })).toBeInTheDocument()
  })

  test('clicking the harvest button calls harvest with the plot id', async () => {
    render(<PlotTile plot={readyPlot} />)
    await userEvent.click(screen.getByRole('button', { name: 'קְצֹר' }))
    expect(mockHarvest).toHaveBeenCalledOnce()
    expect(mockHarvest).toHaveBeenCalledWith('2_2_2')
  })

  test('does not render harvest button when harvested', () => {
    render(<PlotTile plot={harvestedPlot} />)
    expect(screen.queryByRole('button', { name: 'קְצֹר' })).not.toBeInTheDocument()
  })
})

describe('PlotTile — no spurious calls', () => {
  test('clicking growing plot does not call plantWheat or harvest', async () => {
    render(<PlotTile plot={growingPlot} />)
    // The tile div is still in the DOM but no button is shown; clicking the emoji
    const tile = screen.getByText('🌱').closest('div')!
    await userEvent.click(tile)
    expect(mockPlantWheat).not.toHaveBeenCalled()
    expect(mockHarvest).not.toHaveBeenCalled()
  })
})
