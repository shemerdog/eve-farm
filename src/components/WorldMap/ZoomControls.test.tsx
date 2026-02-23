import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { ZoomControls } from './ZoomControls'

describe('ZoomControls — rendering', () => {
    test('renders a zoom-in button', () => {
        render(<ZoomControls zoom={1} onZoomIn={() => {}} onZoomOut={() => {}} />)
        expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
    })

    test('renders a zoom-out button', () => {
        render(<ZoomControls zoom={1} onZoomIn={() => {}} onZoomOut={() => {}} />)
        expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
    })
})

describe('ZoomControls — interactions', () => {
    const onZoomIn = vi.fn()
    const onZoomOut = vi.fn()

    beforeEach(() => {
        onZoomIn.mockReset()
        onZoomOut.mockReset()
    })

    test('clicking zoom-in calls onZoomIn', async () => {
        render(<ZoomControls zoom={1} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />)
        await userEvent.click(screen.getByRole('button', { name: /zoom in/i }))
        expect(onZoomIn).toHaveBeenCalledOnce()
    })

    test('clicking zoom-out calls onZoomOut', async () => {
        render(<ZoomControls zoom={1} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />)
        await userEvent.click(screen.getByRole('button', { name: /zoom out/i }))
        expect(onZoomOut).toHaveBeenCalledOnce()
    })
})

describe('ZoomControls — disabled states', () => {
    test('zoom-out button is disabled at MIN_ZOOM', () => {
        render(<ZoomControls zoom={0.4} onZoomIn={() => {}} onZoomOut={() => {}} />)
        expect(screen.getByRole('button', { name: /zoom out/i })).toBeDisabled()
    })

    test('zoom-in button is disabled at MAX_ZOOM', () => {
        render(<ZoomControls zoom={1.5} onZoomIn={() => {}} onZoomOut={() => {}} />)
        expect(screen.getByRole('button', { name: /zoom in/i })).toBeDisabled()
    })

    test('both buttons are enabled at intermediate zoom', () => {
        render(<ZoomControls zoom={1.0} onZoomIn={() => {}} onZoomOut={() => {}} />)
        expect(screen.getByRole('button', { name: /zoom in/i })).toBeEnabled()
        expect(screen.getByRole('button', { name: /zoom out/i })).toBeEnabled()
    })

    test('clicking disabled zoom-out does not call onZoomOut', async () => {
        const onZoomOut = vi.fn()
        render(<ZoomControls zoom={0.4} onZoomIn={() => {}} onZoomOut={onZoomOut} />)
        await userEvent.click(screen.getByRole('button', { name: /zoom out/i }))
        expect(onZoomOut).not.toHaveBeenCalled()
    })
})
