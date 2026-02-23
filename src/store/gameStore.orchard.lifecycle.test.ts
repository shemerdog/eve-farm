import { beforeEach, describe, expect, it } from 'vitest'
import { FERTILIZE_WAIT_DURATION, TEND_WAIT_DURATION } from '@/game/constants'
import { useGameStore } from './gameStore'
import { buyTileWithWheat, findPlotByCoord, patchPlot, resetGameStore } from '@/test-utils/gameStore'

beforeEach(() => {
    resetGameStore()
})

describe('plantOrchard', () => {
    it('transitions empty grape plot (hasBeenPlanted=false) to planted and sets hasBeenPlanted=true', () => {
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, 'orchard', 'grapes')
        const grapePlot = findPlotByCoord(coord)

        useGameStore.getState().plantOrchard(grapePlot.id)

        const after = useGameStore.getState()
        const updated = after.plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('planted')
        expect(updated.hasBeenPlanted).toBe(true)
    })

    it('is a no-op when hasBeenPlanted=true', () => {
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, 'orchard', 'grapes')
        const grapePlot = findPlotByCoord(coord)

        patchPlot(grapePlot.id, { state: 'empty', hasBeenPlanted: true })

        useGameStore.getState().plantOrchard(grapePlot.id)

        const after = useGameStore.getState()
        const updated = after.plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('empty')
    })
})

describe('fertilizePlot', () => {
    it('transitions planted plot to fertilized', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id
                    ? { ...p, state: 'planted' as const, hasBeenPlanted: true }
                    : p,
            ),
        })

        useGameStore.getState().fertilizePlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('fertilized')
    })

    it('transitions empty plot (hasBeenPlanted=true) to fertilized (subsequent cycle)', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id ? { ...p, state: 'empty' as const, hasBeenPlanted: true } : p,
            ),
        })

        useGameStore.getState().fertilizePlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('fertilized')
    })

    it('is a no-op on empty plot with hasBeenPlanted=false', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.getState().fertilizePlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('empty')
    })
})

describe('tendPlot', () => {
    it('transitions fertilized grape plot to tended', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id
                    ? { ...p, state: 'fertilized' as const, hasBeenPlanted: true }
                    : p,
            ),
        })

        useGameStore.getState().tendPlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('tended')
    })

    it('is a no-op on non-fertilized plots', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.getState().tendPlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('empty')
    })
})

describe('thinShoots', () => {
    it('transitions tended grape plot to growing and sets plantedAt', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id
                    ? { ...p, state: 'tended' as const, hasBeenPlanted: true }
                    : p,
            ),
        })

        const before = Date.now()
        useGameStore.getState().thinShoots(grapePlot.id)
        const after = Date.now()

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('growing')
        expect(updated.plantedAt).not.toBeNull()
        expect(updated.plantedAt!).toBeGreaterThanOrEqual(before)
        expect(updated.plantedAt!).toBeLessThanOrEqual(after)
    })

    it('is a no-op when plot is not tended', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.getState().thinShoots(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('empty')
    })
})

describe('nextActionAt orchard timers', () => {
    it('sets nextActionAt after fertilizing', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: 'planted' as const } : p,
            ),
        })

        const before = Date.now()
        useGameStore.getState().fertilizePlot(plot.id)
        const after = Date.now()

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe('fertilized')
        expect(updated.nextActionAt).not.toBeNull()
        expect(updated.nextActionAt!).toBeGreaterThanOrEqual(before + FERTILIZE_WAIT_DURATION)
        expect(updated.nextActionAt!).toBeLessThanOrEqual(after + FERTILIZE_WAIT_DURATION)
    })

    it('sets nextActionAt on empty→fertilized (subsequent cycle)', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: 'empty' as const, hasBeenPlanted: true } : p,
            ),
        })

        useGameStore.getState().fertilizePlot(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe('fertilized')
        expect(updated.nextActionAt).not.toBeNull()
    })

    it('tendPlot is a no-op when nextActionAt is not null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        const futureTime = Date.now() + 9_000
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id
                    ? { ...p, state: 'fertilized' as const, nextActionAt: futureTime }
                    : p,
            ),
        })

        useGameStore.getState().tendPlot(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe('fertilized')
        expect(updated.nextActionAt).toBe(futureTime)
    })

    it('tendPlot transitions when nextActionAt is null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: 'fertilized' as const, nextActionAt: null } : p,
            ),
        })

        useGameStore.getState().tendPlot(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe('tended')
    })

    it('tendPlot sets nextActionAt after transitioning to tended', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: 'fertilized' as const, nextActionAt: null } : p,
            ),
        })

        const before = Date.now()
        useGameStore.getState().tendPlot(plot.id)
        const after = Date.now()

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe('tended')
        expect(updated.nextActionAt).not.toBeNull()
        expect(updated.nextActionAt!).toBeGreaterThanOrEqual(before + TEND_WAIT_DURATION)
        expect(updated.nextActionAt!).toBeLessThanOrEqual(after + TEND_WAIT_DURATION)
    })

    it('thinShoots is a no-op when nextActionAt is not null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        const futureTime = Date.now() + 9_000
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: 'tended' as const, nextActionAt: futureTime } : p,
            ),
        })

        useGameStore.getState().thinShoots(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe('tended')
        expect(updated.nextActionAt).toBe(futureTime)
    })

    it('thinShoots transitions when nextActionAt is null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: 'tended' as const, nextActionAt: null } : p,
            ),
        })

        useGameStore.getState().thinShoots(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe('growing')
    })
})

