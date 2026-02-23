import { render } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { VineyardTileContent } from './VineyardTileContent'
import type { TileCoord } from '@/types'

vi.mock('@/components/FarmGrid', () => ({
    FarmGrid: ({ tileCoord }: { tileCoord: TileCoord }): React.JSX.Element => (
        <div data-testid="farm-grid" data-col={tileCoord.col} data-row={tileCoord.row} />
    ),
}))

describe('VineyardTileContent', () => {
    test('renders FarmGrid with provided tile coords', (): void => {
        const coord: TileCoord = { col: 3, row: 2 }
        const { getByTestId } = render(<VineyardTileContent tileCoord={coord} />)
        const grid = getByTestId('farm-grid')
        expect(grid).toBeInTheDocument()
        expect(grid.dataset.col).toBe('3')
        expect(grid.dataset.row).toBe('2')
    })

    test('renders wrapper element', (): void => {
        const { container } = render(<VineyardTileContent tileCoord={{ col: 3, row: 2 }} />)
        // The root element should exist (vineyard CSS class applied)
        expect(container.firstChild).toBeTruthy()
    })
})
