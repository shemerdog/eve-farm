import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import { buyTileWithWheat, findPlotByCoord, resetGameStore } from '@/test-utils/gameStore'
import {
    GRAPES_PER_HARVEST,
    BARLEY_GROWTH_DURATION,
    BARLEY_PER_HARVEST,
    WHEAT_GROWTH_DURATION,
} from '@/game/constants'

beforeEach(() => {
    resetGameStore()
})

describe('buyTile with category + subcategory', () => {
    it('buyTile("field", "wheat") creates wheat plots and stores category "field"', () => {
        useGameStore.setState({ wheat: 1000 })

        const coord = { col: 2, row: 1 } // adjacent to default farm at (2,2)
        useGameStore.getState().buyTile(coord, 'field', 'wheat')

        const state = useGameStore.getState()
        const category = state.tileCategories[`${coord.col}_${coord.row}`]
        expect(category).toBe('field')

        const plots = state.plots.filter(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )
        expect(plots.length).toBe(4)
        plots.forEach((p) => expect(p.cropType).toBe('wheat'))
    })

    it('buyTile("field", "barley") creates barley plots and stores category "field"', () => {
        useGameStore.setState({ wheat: 1000 })

        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'field', 'barley')

        const state = useGameStore.getState()
        const category = state.tileCategories[`${coord.col}_${coord.row}`]
        expect(category).toBe('field')

        const plots = state.plots.filter(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )
        expect(plots.length).toBe(4)
        plots.forEach((p) => {
            expect(p.cropType).toBe('barley')
            expect(p.growthDuration).toBe(BARLEY_GROWTH_DURATION)
        })
    })

    it('buyTile("orchard", "grapes") creates grape plots and stores category "orchard"', () => {
        useGameStore.setState({ wheat: 1000 })

        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const category = state.tileCategories[`${coord.col}_${coord.row}`]
        expect(category).toBe('orchard')

        const plots = state.plots.filter(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )
        expect(plots.length).toBe(4)
        plots.forEach((p) => expect(p.cropType).toBe('grapes'))
    })

    it('grape plots have longer growthDuration than wheat', () => {
        useGameStore.setState({ wheat: 1000 })

        const wheatCoord = { col: 2, row: 1 }
        const grapeCoord = { col: 3, row: 2 }

        useGameStore.getState().buyTile(wheatCoord, 'field', 'wheat')
        useGameStore.getState().buyTile(grapeCoord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const wheatPlot = state.plots.find(
            (p) => p.tileCoord.col === wheatCoord.col && p.tileCoord.row === wheatCoord.row,
        )!
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === grapeCoord.col && p.tileCoord.row === grapeCoord.row,
        )!

        expect(grapePlot.growthDuration).toBeGreaterThan(wheatPlot.growthDuration)
    })

    it('buyTile fails when not adjacent (no category stored)', () => {
        useGameStore.setState({ wheat: 1000 })
        const farCoord = { col: 0, row: 0 } // not adjacent to (2,2)
        useGameStore.getState().buyTile(farCoord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        expect(state.tileCategories[`${farCoord.col}_${farCoord.row}`]).toBeUndefined()
    })

    it('barley plots have growthDuration between wheat and grapes', () => {
        useGameStore.setState({ wheat: 1000 })
        const barleyCoord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(barleyCoord, 'field', 'barley')

        const state = useGameStore.getState()
        const barleyPlot = state.plots.find(
            (p) => p.tileCoord.col === barleyCoord.col && p.tileCoord.row === barleyCoord.row,
        )!

        expect(barleyPlot.growthDuration).toBeGreaterThan(WHEAT_GROWTH_DURATION)
        expect(barleyPlot.growthDuration).toBeLessThan(30_000) // grapes
    })
})

describe('gatherSheafs crop yield', () => {
    it('gathering a grape plot adds to grapes counter (not wheat)', () => {
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, 'orchard', 'grapes')
        const state = useGameStore.getState()
        const grapePlot = findPlotByCoord(coord)

        // Force plot into gathered state with known wheat/grapes counts
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            wheat: 0,
            grapes: 0,
        })

        useGameStore.getState().gatherSheafs(grapePlot.id)

        const after = useGameStore.getState()
        expect(after.grapes).toBe(GRAPES_PER_HARVEST)
        expect(after.wheat).toBe(0) // wheat unchanged
    })

    it('gathering a wheat plot adds to wheat counter (not grapes)', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0] // initial farm plot at (2,2)

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            wheat: 0,
            grapes: 0,
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        const after = useGameStore.getState()
        expect(after.wheat).toBe(10)
        expect(after.grapes).toBe(0) // grapes unchanged
    })

    it('initial grapes counter is 0', () => {
        expect(useGameStore.getState().grapes).toBe(0)
    })

    it('resetGame resets grapes to 0', () => {
        useGameStore.setState({ grapes: 99 })
        useGameStore.getState().resetGame()
        expect(useGameStore.getState().grapes).toBe(0)
    })
})

describe('gatherSheafs dilemma routing', () => {
    it('gathering a wheat plot triggers SHIKCHAH_DILEMMA', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: null,
            wheat: 0,
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        const dilemma = useGameStore.getState().activeDilemma
        expect(dilemma).not.toBeNull()
        expect(dilemma?.id).toBe('shikchah')
    })

    it('gathering a grape plot does NOT trigger any dilemma', () => {
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, 'orchard', 'grapes')
        const state = useGameStore.getState()
        const grapePlot = findPlotByCoord(coord)

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: null,
            wheat: 0,
        })

        useGameStore.getState().gatherSheafs(grapePlot.id)

        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('gathering a wheat plot when a dilemma is already active does not overwrite it', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        const existingDilemma = {
            id: 'peah',
            title: 'פֵּאָה',
            narrative: '...',
            choices: [],
        }

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: existingDilemma as never,
            wheat: 0,
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        // The existing dilemma should not be replaced
        expect(useGameStore.getState().activeDilemma?.id).toBe('peah')
    })
})

describe('gatherSheafs — barley', () => {
    it('gathering a barley plot adds to barley counter (not wheat or grapes)', () => {
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
            wheat: 0,
            grapes: 0,
            barley: 0,
        })

        useGameStore.getState().gatherSheafs(barleyPlot.id)

        const after = useGameStore.getState()
        expect(after.barley).toBe(BARLEY_PER_HARVEST)
        expect(after.wheat).toBe(0)
        expect(after.grapes).toBe(0)
    })

    it('initial barley counter is 0', () => {
        expect(useGameStore.getState().barley).toBe(0)
    })

    it('resetGame resets barley to 0', () => {
        useGameStore.setState({ barley: 99 })
        useGameStore.getState().resetGame()
        expect(useGameStore.getState().barley).toBe(0)
    })

    it('gathering a barley plot triggers SHIKCHAH_DILEMMA', () => {
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
            wheat: 0,
        })

        useGameStore.getState().gatherSheafs(barleyPlot.id)

        const dilemma = useGameStore.getState().activeDilemma
        expect(dilemma).not.toBeNull()
        expect(dilemma?.id).toBe('shikchah')
    })
})

describe('harvest dilemma routing', () => {
    it('harvesting a grape plot sets ORLAH_DILEMMA as activeDilemma', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        // Force plot into ready state
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
        })

        useGameStore.getState().harvest(grapePlot.id)

        const dilemma = useGameStore.getState().activeDilemma
        expect(dilemma).not.toBeNull()
        expect(dilemma?.id).toBe('orlah')
    })

    it('harvesting a wheat plot sets PEAH_DILEMMA as activeDilemma', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
        })

        useGameStore.getState().harvest(wheatPlot.id)

        const dilemma = useGameStore.getState().activeDilemma
        expect(dilemma).not.toBeNull()
        expect(dilemma?.id).toBe('peah')
    })

    it('harvesting a barley plot sets PEAH_DILEMMA as activeDilemma', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'field', 'barley')

        const state = useGameStore.getState()
        const barleyPlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
        })

        useGameStore.getState().harvest(barleyPlot.id)

        const dilemma = useGameStore.getState().activeDilemma
        expect(dilemma).not.toBeNull()
        expect(dilemma?.id).toBe('peah')
    })

    it("harvesting a barley plot sets activeDilemmaContext to 'barley'", () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'field', 'barley')

        const state = useGameStore.getState()
        const barleyPlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            activeDilemmaContext: null,
        })

        useGameStore.getState().harvest(barleyPlot.id)

        expect(useGameStore.getState().activeDilemmaContext).toBe('barley')
    })

    it("harvesting a wheat plot sets activeDilemmaContext to 'wheat'", () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]

        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            activeDilemmaContext: null,
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().activeDilemmaContext).toBe('wheat')
    })
})
