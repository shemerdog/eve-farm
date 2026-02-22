import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { ResetButton } from './ResetButton'

const mockResetGame = vi.fn()

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (s: object) => unknown) =>
    selector({ resetGame: mockResetGame }),
}))

beforeEach(() => {
  mockResetGame.mockReset()
})

describe('ResetButton', () => {
  test('renders a reset button', () => {
    render(<ResetButton />)
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  test('clicking the button calls resetGame once', async () => {
    render(<ResetButton />)
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(mockResetGame).toHaveBeenCalledOnce()
  })

  test('calls resetGame with no arguments', async () => {
    render(<ResetButton />)
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(mockResetGame).toHaveBeenCalledWith()
  })
})
