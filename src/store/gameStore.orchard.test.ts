import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import { FERTILIZE_WAIT_DURATION, TEND_WAIT_DURATION } from '@/game/constants'
import type { Plot } from '@/types'
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

        // Simulate already planted
        patchPlot(grapePlot.id, { state: 'empty', hasBeenPlanted: true })

        useGameStore.getState().plantOrchard(grapePlot.id)

        const after = useGameStore.getState()
        const updated = after.plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('empty') // unchanged
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
        expect(updated.state).toBe('empty') // unchanged
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
        expect(updated.state).toBe('empty') // unchanged
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
        expect(updated.state).toBe('empty') // unchanged
    })
})

describe('nextActionAt — fertilizePlot sets wait timer', () => {
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
})

describe('nextActionAt — tendPlot blocked while nextActionAt is set', () => {
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
        expect(updated.state).toBe('fertilized') // unchanged
        expect(updated.nextActionAt).toBe(futureTime) // unchanged
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

    it('tendPlot (grapes) sets nextActionAt after transitioning to tended', () => {
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
})

describe('nextActionAt — thinShoots blocked while nextActionAt is set', () => {
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
        expect(updated.state).toBe('tended') // unchanged
        expect(updated.nextActionAt).toBe(futureTime) // unchanged
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

describe('makePlots initializes nextActionAt=null', () => {
    it('initial farm plots have nextActionAt=null', () => {
        useGameStore.getState().plots.forEach((p) => {
            expect(p.nextActionAt).toBeNull()
        })
    })

    it('buyTile creates plots with nextActionAt=null', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const newPlots = state.plots.filter(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )
        newPlots.forEach((p) => expect(p.nextActionAt).toBeNull())
    })
})

describe('orchard full first-cycle flow (grapes)', () => {
    it('empty→planted→fertilized→tended→growing→ready after timer', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        expect(plot.state).toBe('empty')
        expect(plot.hasBeenPlanted).toBe(false)

        useGameStore.getState().plantOrchard(plot.id)
        expect(useGameStore.getState().plots.find((p) => p.id === plot.id)!.state).toBe('planted')

        useGameStore.getState().fertilizePlot(plot.id)
        expect(useGameStore.getState().plots.find((p) => p.id === plot.id)!.state).toBe(
            'fertilized',
        )

        // Simulate timer expiry before tend (fertilizePlot sets nextActionAt lock)
        useGameStore.setState({
            plots: useGameStore
                .getState()
                .plots.map((p) => (p.id === plot.id ? { ...p, nextActionAt: null } : p)),
        })

        useGameStore.getState().tendPlot(plot.id)
        expect(useGameStore.getState().plots.find((p) => p.id === plot.id)!.state).toBe('tended')

        // Simulate timer expiry before thin shoots (tendPlot sets nextActionAt lock)
        useGameStore.setState({
            plots: useGameStore
                .getState()
                .plots.map((p) => (p.id === plot.id ? { ...p, nextActionAt: null } : p)),
        })

        useGameStore.getState().thinShoots(plot.id)
        expect(useGameStore.getState().plots.find((p) => p.id === plot.id)!.state).toBe('growing')
    })
})

describe('orchard subsequent cycle (hasBeenPlanted persists through gatherSheafs)', () => {
    it('hasBeenPlanted remains true after gatherSheafs resets plot to empty', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const plot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        // Simulate a completed cycle: set hasBeenPlanted=true, state=gathered
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === plot.id ? { ...p, state: 'gathered' as const, hasBeenPlanted: true } : p,
            ),
            activeDilemma: null,
        })

        useGameStore.getState().gatherSheafs(plot.id)

        const updated = useGameStore.getState().plots.find((p) => p.id === plot.id)!
        expect(updated.state).toBe('empty')
        expect(updated.hasBeenPlanted).toBe(true) // persists!
    })

    it('fertilizePlot works on empty plot with hasBeenPlanted=true (skips plant step)', () => {
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
    })
})

describe('makePlots initializes hasBeenPlanted=false', () => {
    it('initial farm plots have hasBeenPlanted=false', () => {
        const state = useGameStore.getState()
        state.plots.forEach((p) => {
            expect(p.hasBeenPlanted).toBe(false)
        })
    })

    it('buyTile creates plots with hasBeenPlanted=false', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const newPlots = state.plots.filter(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )
        newPlots.forEach((p) => expect(p.hasBeenPlanted).toBe(false))
    })

    it('resetGame resets hasBeenPlanted to false on all plots', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

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

describe('gatherSheafs auto-resolves saved SHIKCHAH', () => {
    it('does not show SHIKCHAH modal for wheat when saved decision exists', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:wheat': { choiceIndex: 1, cyclesRemaining: 2, enabled: true },
            },
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('does not show SHIKCHAH modal for barley when saved decision exists', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'field', 'barley')

        const state = useGameStore.getState()
        const barleyPlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:barley': {
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
        useGameStore.getState().buyTile(coord, 'field', 'barley')

        const state = useGameStore.getState()
        const barleyPlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:wheat': { choiceIndex: 2, cyclesRemaining: 5, enabled: true },
                'shikchah:barley': {
                    choiceIndex: 0,
                    cyclesRemaining: 3,
                    enabled: true,
                },
            },
        })

        useGameStore.getState().gatherSheafs(barleyPlot.id)

        const after = useGameStore.getState().savedFieldDecisions
        expect(after['shikchah:barley']?.cyclesRemaining).toBe(2)
        // wheat unchanged
        expect(after['shikchah:wheat']?.cyclesRemaining).toBe(5)
    })

    it('decrements cyclesRemaining for SHIKCHAH on auto-resolve', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:wheat': { choiceIndex: 0, cyclesRemaining: 4, enabled: true },
            },
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['shikchah:wheat']?.cyclesRemaining).toBe(
            3,
        )
    })

    it('removes saved SHIKCHAH when cyclesRemaining reaches 0', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:wheat': { choiceIndex: 0, cyclesRemaining: 1, enabled: true },
            },
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['shikchah:wheat']).toBeUndefined()
    })
})

/** Inject a single "ready" orchard plot at coord {col:3, row:2} into store state. */
function setupOrchardPlot(harvestCount = 0): string {
    const coord = { col: 3, row: 2 }
    const plotId = '3_2_0'
    const plot: Plot = {
        id: plotId,
        state: 'ready',
        plantedAt: Date.now() - 100_000,
        growthDuration: 30_000,
        tileCoord: coord,
        cropType: 'grapes',
        hasBeenPlanted: true,
        nextActionAt: null,
        harvestCount,
    }
    useGameStore.setState({
        ...useGameStore.getState(),
        tileCategories: { '3_2': 'orchard' },
        activeDilemma: null,
        activeDilemmaContext: null,
        activePlotId: null,
        plots: [plot],
        grapes: 0,
    })
    return plotId
}

describe('harvest – orchard cycle gating', () => {
    it('shows ORLAH for cycles 1–3 (harvestCount 0, 1, 2)', () => {
        for (let count = 0; count < 3; count++) {
            const plotId = setupOrchardPlot(count)
            useGameStore.getState().harvest(plotId)
            expect(useGameStore.getState().activeDilemma?.id).toBe('orlah')
        }
    })

    it('shows NETA_REVAI on cycle 4 (harvestCount 3)', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('neta_revai')
    })

    it('shows no dilemma from cycle 5 onwards (harvestCount >= 4)', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma).toBeNull()
        expect(useGameStore.getState().activePlotId).toBeNull()
    })

    it('increments harvestCount on each orchard harvest', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.harvestCount).toBe(1)
    })

    it('sets activePlotId when orchard dilemma fires', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activePlotId).toBe(plotId)
    })

    it('does NOT increment harvestCount for field crops', () => {
        const plotId = '2_2_0'
        useGameStore.setState({
            ...useGameStore.getState(),
            tileCategories: {},
            plots: [
                {
                    id: plotId,
                    state: 'ready',
                    plantedAt: Date.now() - 100_000,
                    growthDuration: 15_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: 'wheat',
                    hasBeenPlanted: false,
                    nextActionAt: null,
                    harvestCount: 0,
                },
            ],
        })
        useGameStore.getState().harvest(plotId)
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.harvestCount).toBe(0)
    })

    it('still shows PEAH for wheat (field crop)', () => {
        const plotId = '2_2_0'
        useGameStore.setState({
            ...useGameStore.getState(),
            tileCategories: {},
            activeDilemma: null,
            savedFieldDecisions: {},
            plots: [
                {
                    id: plotId,
                    state: 'ready',
                    plantedAt: Date.now() - 100_000,
                    growthDuration: 15_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: 'wheat',
                    hasBeenPlanted: false,
                    nextActionAt: null,
                    harvestCount: 0,
                },
            ],
        })
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('peah')
    })
})

describe('resolveDilemma – orchard skip-gather behavior', () => {
    it('ORLAH choice 0 resets plot to empty immediately, no grapes added', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('orlah')

        useGameStore.getState().resolveDilemma(0) // "Leave the fruit"

        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe('empty')
        expect(plot?.plantedAt).toBeNull()
        expect(useGameStore.getState().grapes).toBe(0)
        expect(useGameStore.getState().activePlotId).toBeNull()
        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('ORLAH choice 0 keeps hasBeenPlanted true (fertilize available next)', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(0)
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.hasBeenPlanted).toBe(true)
    })

    it('ORLAH choice 1 does not reset plot — gather step still needed', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(1) // "Take half"
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        // plot is "harvested" still (600ms timer hasn't fired in unit test)
        expect(plot?.state).toBe('harvested')
        expect(useGameStore.getState().activePlotId).toBeNull()
    })

    it('NETA_REVAI choice 0 resets plot to empty, no grapes added', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('neta_revai')

        useGameStore.getState().resolveDilemma(0) // "Save for Jerusalem"

        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe('empty')
        expect(useGameStore.getState().grapes).toBe(0)
        expect(useGameStore.getState().activePlotId).toBeNull()
    })

    it('NETA_REVAI choice 1 does not reset plot — gather step still needed', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(1) // "Take the fruit"
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe('harvested')
    })

    it('activePlotId is cleared on every resolveDilemma call', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activePlotId).toBe(plotId)
        useGameStore.getState().resolveDilemma(2) // "Take all"
        expect(useGameStore.getState().activePlotId).toBeNull()
    })
})

// ── toggleDecisionEnabled ────────────────────────────────────────────────────
