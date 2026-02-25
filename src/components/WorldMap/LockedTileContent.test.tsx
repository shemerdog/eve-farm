import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { LockedTileContent } from './LockedTileContent'
import type { TileCategory, TileSubcategory } from '@/types'

type OnBuy = (category: TileCategory, subcategory: TileSubcategory) => void
type OnBuyMock = ReturnType<typeof vi.fn<OnBuy>>

beforeEach((): void => {
    vi.clearAllMocks()
})

describe('LockedTileContent — inaccessible tile', () => {
    test('renders lock icon and no buttons', (): void => {
        render(
            <LockedTileContent purchasable={false} canAfford={false} price={50} onBuy={() => {}} />,
        )
        expect(screen.getByText('🔒')).toBeInTheDocument()
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
})

describe('LockedTileContent — root step (3 category buttons)', () => {
    test('renders category buttons including structure', (): void => {
        render(<LockedTileContent purchasable canAfford price={50} onBuy={() => {}} />)
        expect(screen.getByRole('button', { name: /שדה|field/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /כרם|orchard/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /מבנים|structure/i })).toBeInTheDocument()
    })

    test('shows price badge', (): void => {
        render(<LockedTileContent purchasable canAfford price={80} onBuy={() => {}} />)
        expect(screen.getByText(/80/)).toBeInTheDocument()
    })

    test('clicking field button advances to field step', async (): Promise<void> => {
        const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>()
        render(<LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />)
        await userEvent.click(screen.getByRole('button', { name: /שדה|field/i }))
        expect(onBuy).not.toHaveBeenCalled()
        // Should now show wheat and barley
        expect(screen.getByRole('button', { name: /חיטה|wheat/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /שעורה|barley/i })).toBeInTheDocument()
    })

    test('clicking orchard button advances to orchard step', async (): Promise<void> => {
        const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>()
        render(<LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />)
        await userEvent.click(screen.getByRole('button', { name: /כרם|orchard/i }))
        expect(onBuy).not.toHaveBeenCalled()
        // Should now show vineyard button
        expect(screen.getByRole('button', { name: /כרם|vineyard/i })).toBeInTheDocument()
    })

    test('structure button calls onBuy("structure", "structure") immediately', async (): Promise<void> => {
        const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>()
        render(<LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />)
        await userEvent.click(screen.getByRole('button', { name: /מבנים|structure/i }))
        expect(onBuy).toHaveBeenCalledWith('structure', 'structure')
        // Returns to root step
        expect(screen.getByRole('button', { name: /שדה|field/i })).toBeInTheDocument()
    })

    test('disables buttons when cannot afford', (): void => {
        render(<LockedTileContent purchasable canAfford={false} price={50} onBuy={() => {}} />)
        screen.getAllByRole('button').forEach((btn) => {
            expect(btn).toBeDisabled()
        })
    })
})

describe('LockedTileContent — field step', () => {
    async function renderFieldStep(onBuy: OnBuyMock = vi.fn<OnBuy>()): Promise<OnBuyMock> {
        render(<LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />)
        await userEvent.click(screen.getByRole('button', { name: /שדה|field/i }))
        return onBuy
    }

    test('Wheat button calls onBuy("field", "wheat") and resets to root', async () => {
        const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>()
        await renderFieldStep(onBuy)
        await userEvent.click(screen.getByRole('button', { name: /חיטה|wheat/i }))
        expect(onBuy).toHaveBeenCalledWith('field', 'wheat')
        // Back at root step — category buttons reappear
        expect(screen.getByRole('button', { name: /שדה|field/i })).toBeInTheDocument()
    })

    test('Barley button calls onBuy("field", "barley") and resets to root', async () => {
        const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>()
        await renderFieldStep(onBuy)
        await userEvent.click(screen.getByRole('button', { name: /שעורה|barley/i }))
        expect(onBuy).toHaveBeenCalledWith('field', 'barley')
        expect(screen.getByRole('button', { name: /שדה|field/i })).toBeInTheDocument()
    })

    test('back button returns to root without buying', async (): Promise<void> => {
        const onBuy = vi.fn<OnBuy>()
        await renderFieldStep(onBuy)
        await userEvent.click(screen.getByRole('button', { name: /back|←|חזור/i }))
        expect(onBuy).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: /שדה|field/i })).toBeInTheDocument()
    })
})

describe('LockedTileContent — orchard step', () => {
    async function renderOrchardStep(onBuy: OnBuyMock = vi.fn<OnBuy>()): Promise<OnBuyMock> {
        render(<LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />)
        await userEvent.click(screen.getByRole('button', { name: /כרם|orchard/i }))
        return onBuy
    }

    test('Vineyard button calls onBuy("orchard", "grapes") and resets to root', async () => {
        const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>()
        await renderOrchardStep(onBuy)
        // The vineyard button — it's the main action button now on orchard step
        const vineyardBtn = screen
            .getAllByRole('button')
            .find((b) => /כרם|vineyard/i.test(b.textContent ?? ''))
        expect(vineyardBtn).toBeDefined()
        await userEvent.click(vineyardBtn!)
        expect(onBuy).toHaveBeenCalledWith('orchard', 'grapes')
        expect(screen.getByRole('button', { name: /שדה|field/i })).toBeInTheDocument()
    })

    test('back button returns to root without buying', async (): Promise<void> => {
        const onBuy = vi.fn<OnBuy>()
        await renderOrchardStep(onBuy)
        await userEvent.click(screen.getByRole('button', { name: /back|←|חזור/i }))
        expect(onBuy).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: /שדה|field/i })).toBeInTheDocument()
    })

    test('disables buttons when cannot afford', (): void => {
        render(<LockedTileContent purchasable canAfford={false} price={50} onBuy={() => {}} />)
        // All buttons disabled at root; can't navigate but test the state
        screen.getAllByRole('button').forEach((btn) => {
            expect(btn).toBeDisabled()
        })
    })
})
