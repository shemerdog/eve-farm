import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { LockedTileContent } from './LockedTileContent'

describe('LockedTileContent — inaccessible tile', () => {
  test('shows lock emoji when not purchasable', () => {
    render(
      <LockedTileContent
        purchasable={false}
        canAfford={false}
        price={50}
        onBuy={() => {}}
      />
    )
    expect(screen.getByText('🔒')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('LockedTileContent — purchasable tile', () => {
  test('shows price badge and buy button when purchasable', () => {
    render(
      <LockedTileContent
        purchasable
        canAfford
        price={50}
        onBuy={() => {}}
      />
    )
    expect(screen.getByText(/50/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buy land/i })).toBeInTheDocument()
  })

  test('buy button is enabled when canAfford is true', () => {
    render(
      <LockedTileContent purchasable canAfford price={50} onBuy={() => {}} />
    )
    expect(screen.getByRole('button', { name: /buy land/i })).toBeEnabled()
  })

  test('buy button is disabled when canAfford is false', () => {
    render(
      <LockedTileContent purchasable canAfford={false} price={50} onBuy={() => {}} />
    )
    expect(screen.getByRole('button', { name: /buy land/i })).toBeDisabled()
  })

  test('clicking buy button calls onBuy', async () => {
    const onBuy = vi.fn()
    render(
      <LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />
    )
    await userEvent.click(screen.getByRole('button', { name: /buy land/i }))
    expect(onBuy).toHaveBeenCalledOnce()
  })

  test('clicking disabled buy button does not call onBuy', async () => {
    const onBuy = vi.fn()
    render(
      <LockedTileContent purchasable canAfford={false} price={50} onBuy={onBuy} />
    )
    await userEvent.click(screen.getByRole('button', { name: /buy land/i }))
    expect(onBuy).not.toHaveBeenCalled()
  })
})

describe('LockedTileContent — price display', () => {
  test('shows the correct price in the badge', () => {
    render(
      <LockedTileContent purchasable canAfford price={80} onBuy={() => {}} />
    )
    expect(screen.getByText(/80/)).toBeInTheDocument()
  })

  beforeEach(() => vi.clearAllMocks())
})
