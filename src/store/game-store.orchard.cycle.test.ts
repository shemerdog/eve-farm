import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './game-store'
import { resetGameStore } from '@/test-utils/game-store'
import { TileCategory, TileSubcategory, PlotState } from '@/types'

beforeEach(() => {
    resetGameStore()
})

describe('orchard cycle behavior', () => {
    it('makePlots initializes nextActionAt to null', () => {
        useGameStore.getState().plots.forEach((p) => {
            expect(p.nextActionAt).toBeNull()
        })
    })

    it('buyTile creates plots with nextActionAt=null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const newPlots = state.plots.filter(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )
        newPlots.forEach((p) => expect(p.nextActionAt).toBeNull())
    })

    it('empty→planted→fertilized→tended→growing first-cycle flow', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        expect(plot.state).toBe(PlotState.Empty)
        expect(plot.hasBeenPlanted).toBe(false)

        useGameStore.getState().plantOrchard(plot.id)
        expect(useGameStore.getState().plots.find((p) => p.id === plot.id)!.state).toBe(PlotState.Planted)

        useGameStore.getState().fertilizePlot(plot.id)
        expect(useGameStore.getState().plots.find((p) => p.id === plot.id)!.state).toBe(PlotState.Fertilized)

        useGameStore.setState({
            plots: useGameStore
                .getState()
                .plots.map((p) => (p.id === plot.id ? { ...p, nextActionAt: null } : p)),
        })

        useGameStore.getState().tendPlot(plot.id)
        expect(useGameStore.getState().plots.find((p) => p.id === plot.id)!.state).toBe(PlotState.Tended)

        useGameStore.setState({
            plots: useGameStore
                .getState()
                .plots.map((p) => (p.id === plot.id ? { ...p, nextActionAt: null } : p)),
        })

        useGameStore.getState().thinShoots(plot.id)
        expect(useGameStore.getState().plots.find((p) => p.id === plot.id)!.state).toBe(PlotState.Growing)
    })

    it('hasBeenPlanted remains true after gatherSheafs resets plot to empty', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: PlotState.Gathered, hasBeenPlanted: true } : p,
            ),
            activeDilemma: null,
        })

        useGameStore.getState().gatherSheafs(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe(PlotState.Empty)
        expect(updated.hasBeenPlanted).toBe(true)
    })

    it('fertilizePlot works on empty plot with hasBeenPlanted=true (skips plant step)', () => {
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
    })

    it('makePlots initializes hasBeenPlanted=false', () => {
        const state = useGameStore.getState()
        state.plots.forEach((p) => {
            expect(p.hasBeenPlanted).toBe(false)
        })
    })

    it('buyTile creates plots with hasBeenPlanted=false', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const newPlots = state.plots.filter(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )
        newPlots.forEach((p) => expect(p.hasBeenPlanted).toBe(false))
    })

    it('resetGame resets hasBeenPlanted to false on all plots', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Orchard, TileSubcategory.Grapes)

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) => (p.id === plot.id ? { ...p, hasBeenPlanted: true } : p)),
        })

        useGameStore.getState().resetGame()

        useGameStore.getState().plots.forEach((p) => expect(p.hasBeenPlanted).toBe(false))
    })
})
