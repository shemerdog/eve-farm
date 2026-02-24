import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { ResetButton } from './ResetButton'

const mockResetGame = vi.fn()

vi.mock('@/store/game-store', () => ({
    useGameStore: (selector: (s: object) => unknown): unknown =>
        selector({ resetGame: mockResetGame }),
}))

beforeEach((): void => {
    mockResetGame.mockReset()
})

describe('ResetButton', () => {
    test('renders reset button', (): void => {
        render(<ResetButton />)
        expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
    })

    test('clicking reset calls resetGame', async (): Promise<void> => {
        render(<ResetButton />)
        await userEvent.click(screen.getByRole('button', { name: /reset/i }))
        expect(mockResetGame).toHaveBeenCalledOnce()
    })

    test('calls resetGame with no arguments', async (): Promise<void> => {
        render(<ResetButton />)
        await userEvent.click(screen.getByRole('button', { name: /reset/i }))
        expect(mockResetGame).toHaveBeenCalledWith()
    })
})
