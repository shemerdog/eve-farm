import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './game-store'
import { FARM_COORD } from '@/game/world-map'
import { calcTilePrice } from '@/game/constants'
import { DILEMMAS } from '@/game/dilemmas'

// Reset store data between tests (don't use replace mode — it strips action functions)
beforeEach(() => {
    const initial = useGameStore.getInitialState()
    useGameStore.setState({
        plots: initial.plots,
        wheat: initial.wheat,
        meters: initial.meters,
        activeDilemma: initial.activeDilemma,
        purchasedCoords: initial.purchasedCoords,
    })
})

describe('gameStore — initial plots', () => {
    it('starts with 4 plots tagged with FARM_COORD', () => {
        const { plots } = useGameStore.getState()
        expect(plots).toHaveLength(4)
        for (const plot of plots) {
            expect(plot.tileCoord).toEqual(FARM_COORD)
        }
    })

    it('assigns string IDs in col_row_idx format', () => {
        const { plots } = useGameStore.getState()
        expect(plots.map((p) => p.id)).toEqual(['2_2_0', '2_2_1', '2_2_2', '2_2_3'])
    })
})

describe('gameStore — buyTile creates plots', () => {
    const adjacentCoord = { col: 3, row: 2 } // adjacent to FARM_COORD

    it('creates 4 new plots when a tile is bought', () => {
        const price = calcTilePrice(0)
        useGameStore.setState({ wheat: price })

        useGameStore.getState().buyTile(adjacentCoord, 'field', 'wheat')

        const { plots } = useGameStore.getState()
        expect(plots).toHaveLength(8) // 4 original + 4 new
    })

    it('new plots are tagged with the purchased tile coord', () => {
        const price = calcTilePrice(0)
        useGameStore.setState({ wheat: price })

        useGameStore.getState().buyTile(adjacentCoord, 'field', 'wheat')

        const { plots } = useGameStore.getState()
        const newPlots = plots.filter(
            (p) => p.tileCoord.col === adjacentCoord.col && p.tileCoord.row === adjacentCoord.row,
        )
        expect(newPlots).toHaveLength(4)
        expect(newPlots.map((p) => p.id)).toEqual(['3_2_0', '3_2_1', '3_2_2', '3_2_3'])
    })

    it('new plots start in empty state', () => {
        const price = calcTilePrice(0)
        useGameStore.setState({ wheat: price })

        useGameStore.getState().buyTile(adjacentCoord, 'field', 'wheat')

        const { plots } = useGameStore.getState()
        const newPlots = plots.filter(
            (p) => p.tileCoord.col === adjacentCoord.col && p.tileCoord.row === adjacentCoord.row,
        )
        for (const plot of newPlots) {
            expect(plot.state).toBe('empty')
        }
    })

    it('does not create plots if purchase fails (not enough wheat)', () => {
        useGameStore.setState({ wheat: 0 })

        useGameStore.getState().buyTile(adjacentCoord, 'field', 'wheat')

        const { plots } = useGameStore.getState()
        expect(plots).toHaveLength(4) // only original plots
    })
})

describe('gameStore — harvest transitions to harvested state', () => {
    it('harvest transitions a ready plot to harvested', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'ready' as const } : p)),
        })

        useGameStore.getState().harvest(plotId)

        const { plots: updated } = useGameStore.getState()
        expect(updated.find((p) => p.id === plotId)?.state).toBe('harvested')
    })

    it('harvest does NOT immediately award wheat', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'ready' as const } : p)),
            wheat: 0,
        })

        useGameStore.getState().harvest(plotId)

        expect(useGameStore.getState().wheat).toBe(0)
    })

    it('harvest triggers peah dilemma', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'ready' as const } : p)),
        })

        useGameStore.getState().harvest(plotId)

        const { activeDilemma } = useGameStore.getState()
        expect(activeDilemma).not.toBeNull()
        expect(activeDilemma?.id).toBe('peah')
    })

    it('harvest triggers peah dilemma on every harvest', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        // First harvest + resolve
        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'ready' as const } : p)),
        })
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(0)
        expect(useGameStore.getState().activeDilemma).toBeNull()

        // Second harvest — peah must fire again
        useGameStore.setState({
            plots: useGameStore
                .getState()
                .plots.map((p) => (p.id === plotId ? { ...p, state: 'ready' as const } : p)),
        })
        useGameStore.getState().harvest(plotId)

        const { activeDilemma } = useGameStore.getState()
        expect(activeDilemma).not.toBeNull()
        expect(activeDilemma?.id).toBe('peah')
    })

    it('harvest does not override an already-active dilemma', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id
        const maaser = DILEMMAS.find((d) => d.id === 'maaser')!

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'ready' as const } : p)),
            activeDilemma: maaser,
        })

        useGameStore.getState().harvest(plotId)

        expect(useGameStore.getState().activeDilemma?.id).toBe('maaser')
    })

    it('harvest is a no-op on a non-ready plot', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id
        // state is "empty" by default

        useGameStore.getState().harvest(plotId)

        const { plots: updated } = useGameStore.getState()
        expect(updated.find((p) => p.id === plotId)?.state).toBe('empty')
    })
})

describe('gameStore — gatherSheafs', () => {
    it('transitions a gathered plot to empty', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'gathered' as const } : p)),
        })

        useGameStore.getState().gatherSheafs(plotId)

        const { plots: updated } = useGameStore.getState()
        expect(updated.find((p) => p.id === plotId)?.state).toBe('empty')
    })

    it('awards WHEAT_PER_HARVEST wheat on gather', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'gathered' as const } : p)),
            wheat: 5,
        })

        useGameStore.getState().gatherSheafs(plotId)

        expect(useGameStore.getState().wheat).toBe(15) // 5 + WHEAT_PER_HARVEST(10)
    })

    it('triggers shikchah dilemma on gatherSheafs', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'gathered' as const } : p)),
        })

        useGameStore.getState().gatherSheafs(plotId)

        const { activeDilemma } = useGameStore.getState()
        expect(activeDilemma).not.toBeNull()
        expect(activeDilemma?.id).toBe('shikchah')
    })

    it('gatherSheafs does not override an already-active dilemma', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id
        const maaser = DILEMMAS.find((d) => d.id === 'maaser')!

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'gathered' as const } : p)),
            activeDilemma: maaser,
        })

        useGameStore.getState().gatherSheafs(plotId)

        expect(useGameStore.getState().activeDilemma?.id).toBe('maaser')
    })

    it('is a no-op on a non-gathered plot', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id
        // state is "empty" by default

        useGameStore.setState({ wheat: 0 })

        useGameStore.getState().gatherSheafs(plotId)

        expect(useGameStore.getState().wheat).toBe(0)
        const { plots: updated } = useGameStore.getState()
        expect(updated.find((p) => p.id === plotId)?.state).toBe('empty')
    })
})

describe('gameStore — plowPlot', () => {
    it('transitions an empty plot to plowed', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.getState().plowPlot(plotId)

        const { plots: updated } = useGameStore.getState()
        expect(updated.find((p) => p.id === plotId)?.state).toBe('plowed')
    })

    it('is a no-op on a non-empty plot', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.setState({
            plots: plots.map((p) =>
                p.id === plotId ? { ...p, state: 'growing' as const, plantedAt: Date.now() } : p,
            ),
        })

        useGameStore.getState().plowPlot(plotId)

        const { plots: updated } = useGameStore.getState()
        expect(updated.find((p) => p.id === plotId)?.state).toBe('growing')
    })
})

describe('gameStore — plantWheat requires plowed state', () => {
    it('transitions a plowed plot to growing', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.setState({
            plots: plots.map((p) => (p.id === plotId ? { ...p, state: 'plowed' as const } : p)),
        })

        useGameStore.getState().plantWheat(plotId)

        const { plots: updated } = useGameStore.getState()
        expect(updated.find((p) => p.id === plotId)?.state).toBe('growing')
    })

    it('is a no-op on an empty plot (must plow first)', () => {
        const { plots } = useGameStore.getState()
        const plotId = plots[0].id

        useGameStore.getState().plantWheat(plotId)

        const { plots: updated } = useGameStore.getState()
        expect(updated.find((p) => p.id === plotId)?.state).toBe('empty')
    })
})
