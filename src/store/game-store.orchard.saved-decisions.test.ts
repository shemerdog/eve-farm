import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './game-store'
import { resetGameStore } from '@/test-utils/game-store'
import { TileCategory, TileSubcategory, PlotState } from '@/types'

beforeEach(() => {
    resetGameStore()
})

describe('gatherSheafs auto-resolves saved SHIKCHAH', () => {
    it('does not show SHIKCHAH modal for wheat when saved decision exists', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Gathered } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:Wheat': { choiceIndex: 1, cyclesRemaining: 2, enabled: true },
            },
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('does not show SHIKCHAH modal for barley when saved decision exists', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Field, TileSubcategory.Barley)

        const state = useGameStore.getState()
        const barleyPlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: PlotState.Gathered } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:Barley': {
                    choiceIndex: 0,
                    cyclesRemaining: 3,
                    enabled: true,
                },
            },
        })

        useGameStore.getState().gatherSheafs(barleyPlot.id)

        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('barley shikchah saved decision does not affect wheat shikchah', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, TileCategory.Field, TileSubcategory.Barley)

        const state = useGameStore.getState()
        const barleyPlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: PlotState.Gathered } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:Wheat': { choiceIndex: 2, cyclesRemaining: 5, enabled: true },
                'shikchah:Barley': {
                    choiceIndex: 0,
                    cyclesRemaining: 3,
                    enabled: true,
                },
            },
        })

        useGameStore.getState().gatherSheafs(barleyPlot.id)

        const after = useGameStore.getState().savedFieldDecisions
        expect(after['shikchah:Barley']?.cyclesRemaining).toBe(2)
        expect(after['shikchah:Wheat']?.cyclesRemaining).toBe(5)
    })

    it('decrements cyclesRemaining for SHIKCHAH on auto-resolve', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Gathered } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:Wheat': { choiceIndex: 0, cyclesRemaining: 4, enabled: true },
            },
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['shikchah:Wheat']?.cyclesRemaining).toBe(
            3,
        )
    })

    it('removes saved SHIKCHAH when cyclesRemaining reaches 0', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Gathered } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:Wheat': { choiceIndex: 0, cyclesRemaining: 1, enabled: true },
            },
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['shikchah:Wheat']).toBeUndefined()
    })
})
