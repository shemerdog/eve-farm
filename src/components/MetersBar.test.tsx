import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { MetersBar } from './MetersBar'

vi.mock('@/store/gameStore', () => ({
    useGameStore: (selector: (s: object) => unknown) =>
        selector({
            meters: { devotion: 50, morality: 60, faithfulness: 40 },
        }),
}))

const mockOnManageDecisions = vi.fn()

beforeEach(() => {
    mockOnManageDecisions.mockReset()
})

describe('MetersBar', () => {
    test('renders devotion, morality, and faithfulness meters', () => {
        render(<MetersBar onManageDecisions={mockOnManageDecisions} />)
        expect(screen.getByText('דְּבֵקוּת')).toBeInTheDocument()
        expect(screen.getByText('מוּסָרִיּוּת')).toBeInTheDocument()
        expect(screen.getByText('נֶאֱמָנוּת')).toBeInTheDocument()
    })

    test('renders the manage decisions gear button', () => {
        render(<MetersBar onManageDecisions={mockOnManageDecisions} />)
        expect(screen.getByRole('button', { name: /נהל החלטות/i })).toBeInTheDocument()
    })

    test('clicking the gear button calls onManageDecisions', async () => {
        render(<MetersBar onManageDecisions={mockOnManageDecisions} />)
        await userEvent.click(screen.getByRole('button', { name: /נהל החלטות/i }))
        expect(mockOnManageDecisions).toHaveBeenCalledOnce()
    })

    test('calls onManageDecisions with no arguments', async () => {
        render(<MetersBar onManageDecisions={mockOnManageDecisions} />)
        await userEvent.click(screen.getByRole('button', { name: /נהל החלטות/i }))
        expect(mockOnManageDecisions).toHaveBeenCalledWith()
    })
})
