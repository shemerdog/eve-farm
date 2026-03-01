import { beforeEach, describe, expect, it } from 'vitest'
import { FERTILIZE_WAIT_DURATION, TEND_WAIT_DURATION } from '@/game/constants'
import { useGameStore } from './game-store'
import { buyTileWithWheat, findPlotByCoord, patchPlot, resetGameStore } from '@/test-utils/game-store'
import { PlotState, TileCategory, TileSubcategory } from '@/types'

beforeEach(() => {
    resetGameStore()
})

describe('plantOrchard', () => {
    it('transitions empty grape plot (hasBeenPlanted=false) to planted and sets hasBeenPlanted=true', () => {
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, TileCategory.Orchard, TileSubcategory.Grapes)
        const grapePlot = findPlotByCoord(coord)

        useGameStore.getState().plantOrchard(grapePlot.id)

        const after = useGameStore.getState()
        const updated = after.plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Planted)
        expect(updated.hasBeenPlanted).toBe(true)
    })

    it('is a no-op when hasBeenPlanted=true', () => {
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, TileCategory.Orchard, TileSubcategory.Grapes)
        const grapePlot = findPlotByCoord(coord)

        patchPlot(grapePlot.id, { state: PlotState.Empty, hasBeenPlanted: true })

        useGameStore.getState().plantOrchard(grapePlot.id)

        const after = useGameStore.getState()
        const updated = after.plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Empty)
    })
})

describe('fertilizePlot', () => {
    it('transitions planted plot to fertilized', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id
                    ? { ...p, state: PlotState.Planted, hasBeenPlanted: true }
                    : p,
            ),
        })

        useGameStore.getState().fertilizePlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Fertilized)
    })

    it('transitions empty plot (hasBeenPlanted=true) to fertilized (subsequent cycle)', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id ? { ...p, state: PlotState.Empty, hasBeenPlanted: true } : p,
            ),
        })

        useGameStore.getState().fertilizePlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Fertilized)
    })

    it('is a no-op on empty plot with hasBeenPlanted=false', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.getState().fertilizePlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Empty)
    })
})

describe('tendPlot', () => {
    it('transitions fertilized grape plot to tended', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id
                    ? { ...p, state: PlotState.Fertilized, hasBeenPlanted: true }
                    : p,
            ),
        })

        useGameStore.getState().tendPlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Tended)
    })

    it('is a no-op on non-fertilized plots', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.getState().tendPlot(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Empty)
    })
})

describe('thinShoots', () => {
    it('transitions tended grape plot to growing and sets plantedAt', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id
                    ? { ...p, state: PlotState.Tended, hasBeenPlanted: true }
                    : p,
            ),
        })

        const before = Date.now()
        useGameStore.getState().thinShoots(grapePlot.id)
        const after = Date.now()

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Growing)
        expect(updated.plantedAt).not.toBeNull()
        expect(updated.plantedAt!).toBeGreaterThanOrEqual(before)
        expect(updated.plantedAt!).toBeLessThanOrEqual(after)
    })

    it('is a no-op when plot is not tended', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.getState().thinShoots(grapePlot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe(PlotState.Empty)
    })
})

describe('nextActionAt orchard timers', () => {
    it('sets nextActionAt after fertilizing', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: PlotState.Planted } : p,
            ),
        })

        const before = Date.now()
        useGameStore.getState().fertilizePlot(plot.id)
        const after = Date.now()

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe(PlotState.Fertilized)
        expect(updated.nextActionAt).not.toBeNull()
        expect(updated.nextActionAt!).toBeGreaterThanOrEqual(before + FERTILIZE_WAIT_DURATION)
        expect(updated.nextActionAt!).toBeLessThanOrEqual(after + FERTILIZE_WAIT_DURATION)
    })

    it('sets nextActionAt on empty→fertilized (subsequent cycle)', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: PlotState.Empty, hasBeenPlanted: true } : p,
            ),
        })

        useGameStore.getState().fertilizePlot(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe(PlotState.Fertilized)
        expect(updated.nextActionAt).not.toBeNull()
    })

    it('tendPlot is a no-op when nextActionAt is not null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        const futureTime = Date.now() + 9_000
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id
                    ? { ...p, state: PlotState.Fertilized, nextActionAt: futureTime }
                    : p,
            ),
        })

        useGameStore.getState().tendPlot(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe(PlotState.Fertilized)
        expect(updated.nextActionAt).toBe(futureTime)
    })

    it('tendPlot transitions when nextActionAt is null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: PlotState.Fertilized, nextActionAt: null } : p,
            ),
        })

        useGameStore.getState().tendPlot(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe(PlotState.Tended)
    })

    it('tendPlot sets nextActionAt after transitioning to tended', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: PlotState.Fertilized, nextActionAt: null } : p,
            ),
        })

        const before = Date.now()
        useGameStore.getState().tendPlot(plot.id)
        const after = Date.now()

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe(PlotState.Tended)
        expect(updated.nextActionAt).not.toBeNull()
        expect(updated.nextActionAt!).toBeGreaterThanOrEqual(before + TEND_WAIT_DURATION)
        expect(updated.nextActionAt!).toBeLessThanOrEqual(after + TEND_WAIT_DURATION)
    })

    it('thinShoots is a no-op when nextActionAt is not null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        const futureTime = Date.now() + 9_000
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: PlotState.Tended, nextActionAt: futureTime } : p,
            ),
        })

        useGameStore.getState().thinShoots(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe(PlotState.Tended)
        expect(updated.nextActionAt).toBe(futureTime)
    })

    it('thinShoots transitions when nextActionAt is null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: PlotState.Tended, nextActionAt: null } : p,
            ),
        })

        useGameStore.getState().thinShoots(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe(PlotState.Growing)
    })
})
