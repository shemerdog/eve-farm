import { render } from '@testing-library/react'
import { vi, describe, test, expect } from 'vitest'
import { BarleyFieldTileContent } from './BarleyFieldTileContent'
import type { TileCoord } from '@/types'

vi.mock('@/components/FarmGrid', () => ({
    FarmGrid: ({ tileCoord }: { tileCoord: TileCoord }) => (
        <div data-testid="farm-grid" data-col={tileCoord.col} data-row={tileCoord.row} />
    ),
}))

describe('BarleyFieldTileContent', () => {
    test('renders FarmGrid with the provided tileCoord', () => {
        const coord: TileCoord = { col: 3, row: 2 }
        const { getByTestId } = render(<BarleyFieldTileContent tileCoord={coord} />)
        const grid = getByTestId('farm-grid')
        expect(grid).toBeInTheDocument()
        expect(grid).toHaveAttribute('data-col', '3')
        expect(grid).toHaveAttribute('data-row', '2')
    })

    test('renders a container element', () => {
        const coord: TileCoord = { col: 1, row: 1 }
        const { container } = render(<BarleyFieldTileContent tileCoord={coord} />)
        expect(container.firstChild).toBeInTheDocument()
    })
})
