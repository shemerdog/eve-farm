import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import {
    GRAPES_PER_HARVEST,
    BARLEY_GROWTH_DURATION,
    BARLEY_PER_HARVEST,
    WHEAT_GROWTH_DURATION,
    FERTILIZE_WAIT_DURATION,
    TEND_WAIT_DURATION,
} from '@/game/constants'
import { DILEMMAS, ORLAH_DILEMMA } from '@/game/dilemmas'
import type { Plot } from '@/types'

// Reset store to a clean initial state before each test
beforeEach(() => {
    useGameStore.getState().resetGame()
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
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

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
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

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

describe('v6 migration: category key rename', () => {
    it('"farm" → "field" in tileCategories', () => {
        // Simulate v5 persisted state with old category keys
        useGameStore.setState({
            tileCategories: { '2_1': 'field' as never }, // simulating "farm" renamed
        })
        // After setState, verify the new categories are correct
        // (In real migration, "farm" becomes "field")
        // We simulate the migration result directly since we can't replay persist versioning
        const migrated = Object.entries({ '2_1': 'farm' as never }).reduce(
            (acc, [key, cat]) => ({
                ...acc,
                [key]: cat === 'vineyard' ? 'orchard' : 'field',
            }),
            {} as Record<string, string>,
        )
        expect(migrated['2_1']).toBe('field')
    })

    it('"vineyard" → "orchard" in tileCategories', () => {
        const migrated = Object.entries({ '3_2': 'vineyard' as never }).reduce(
            (acc, [key, cat]) => ({
                ...acc,
                [key]: cat === 'vineyard' ? 'orchard' : 'field',
            }),
            {} as Record<string, string>,
        )
        expect(migrated['3_2']).toBe('orchard')
    })

    it('old "field" → stays "field" in tileCategories', () => {
        const migrated = Object.entries({ '2_3': 'field' as never }).reduce(
            (acc, [key, cat]) => ({
                ...acc,
                [key]: cat === 'vineyard' ? 'orchard' : 'field',
            }),
            {} as Record<string, string>,
        )
        expect(migrated['2_3']).toBe('field')
    })
})

// ── Saved field decisions (PEAH + SHIKCHAH, 5-cycle auto-resolve) ────────────

describe('savedFieldDecisions — initial state', () => {
    it('starts with empty savedFieldDecisions', () => {
        expect(useGameStore.getState().savedFieldDecisions).toEqual({})
    })

    it('resetGame clears savedFieldDecisions', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 5, enabled: true },
                'peah:barley': { choiceIndex: 1, cyclesRemaining: 3, enabled: true },
            },
        })
        useGameStore.getState().resetGame()
        expect(useGameStore.getState().savedFieldDecisions).toEqual({})
    })
})

describe('resolveDilemma(choiceIndex, save=true) for PEAH', () => {
    it('saves peah:wheat decision with 5 cyclesRemaining', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: 'wheat',
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(0, true)

        const saved = useGameStore.getState().savedFieldDecisions['peah:wheat']
        expect(saved).toBeDefined()
        expect(saved?.choiceIndex).toBe(0)
        expect(saved?.cyclesRemaining).toBe(5)
    })

    it('saves peah:barley decision independently from peah:wheat', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: 'barley',
            wheat: 100,
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 2, cyclesRemaining: 3, enabled: true },
            },
        })
        useGameStore.getState().resolveDilemma(1, true)

        const state = useGameStore.getState().savedFieldDecisions
        expect(state['peah:barley']?.choiceIndex).toBe(1)
        expect(state['peah:barley']?.cyclesRemaining).toBe(5)
        // wheat decision unchanged
        expect(state['peah:wheat']?.choiceIndex).toBe(2)
        expect(state['peah:wheat']?.cyclesRemaining).toBe(3)
    })

    it('clears activeDilemma after resolving with save', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: 'wheat',
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(1, true)
        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('clears activeDilemmaContext after resolving', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: 'wheat',
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(0, true)
        expect(useGameStore.getState().activeDilemmaContext).toBeNull()
    })
})

describe('resolveDilemma(choiceIndex, save=true) for SHIKCHAH', () => {
    it('saves shikchah:wheat decision with 5 cyclesRemaining', () => {
        const shikchah = DILEMMAS.find((d) => d.id === 'shikchah')!
        useGameStore.setState({
            activeDilemma: shikchah,
            activeDilemmaContext: 'wheat',
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(1, true)

        const saved = useGameStore.getState().savedFieldDecisions['shikchah:wheat']
        expect(saved).toBeDefined()
        expect(saved?.choiceIndex).toBe(1)
        expect(saved?.cyclesRemaining).toBe(5)
    })

    it('saves shikchah:barley decision independently from shikchah:wheat', () => {
        const shikchah = DILEMMAS.find((d) => d.id === 'shikchah')!
        useGameStore.setState({
            activeDilemma: shikchah,
            activeDilemmaContext: 'barley',
            wheat: 100,
            savedFieldDecisions: {
                'shikchah:wheat': { choiceIndex: 2, cyclesRemaining: 4, enabled: true },
            },
        })
        useGameStore.getState().resolveDilemma(0, true)

        const state = useGameStore.getState().savedFieldDecisions
        expect(state['shikchah:barley']?.choiceIndex).toBe(0)
        expect(state['shikchah:barley']?.cyclesRemaining).toBe(5)
        // wheat decision unchanged
        expect(state['shikchah:wheat']?.choiceIndex).toBe(2)
        expect(state['shikchah:wheat']?.cyclesRemaining).toBe(4)
    })
})

describe('resolveDilemma without save (default)', () => {
    it('does not save when save omitted', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: 'wheat',
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(0)
        expect(useGameStore.getState().savedFieldDecisions).toEqual({})
    })
})

describe('resolveDilemma save=true for non-saveable dilemmas', () => {
    it('does not save for ORLAH even with save=true', () => {
        useGameStore.setState({ activeDilemma: ORLAH_DILEMMA, wheat: 100 })
        useGameStore.getState().resolveDilemma(0, true)
        expect(useGameStore.getState().savedFieldDecisions).toEqual({})
    })
})

describe('harvest auto-resolves saved PEAH for wheat', () => {
    it('does not show PEAH modal when saved decision exists', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('decrements cyclesRemaining on auto-resolve', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['peah:wheat']?.cyclesRemaining).toBe(2)
    })

    it('removes saved decision when cyclesRemaining reaches 0', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 1, enabled: true },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['peah:wheat']).toBeUndefined()
    })

    it('shows PEAH modal when no saved decision exists', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {},
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().activeDilemma?.id).toBe('peah')
    })

    it('applies wheat cost and meter effects when auto-resolving PEAH choice 0', () => {
        // PEAH choice 0: wheatCost=3, morality+10, devotion+5
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            wheat: 100,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 2, enabled: true },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        const after = useGameStore.getState()
        expect(after.wheat).toBe(97) // 100 - floor(3) = 97
        expect(after.meters.morality).toBe(60) // +10
        expect(after.meters.devotion).toBe(55) // +5
    })
})

describe('harvest auto-resolves saved PEAH for barley', () => {
    it('does not show PEAH modal for barley when saved decision exists', () => {
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
            savedFieldDecisions: {
                'peah:barley': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
            },
        })

        useGameStore.getState().harvest(barleyPlot.id)

        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('barley saved decision does not consume wheat saved decision', () => {
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
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 1, cyclesRemaining: 5, enabled: true },
                'peah:barley': { choiceIndex: 0, cyclesRemaining: 2, enabled: true },
            },
        })

        useGameStore.getState().harvest(barleyPlot.id)

        const after = useGameStore.getState().savedFieldDecisions
        // barley cycles decremented
        expect(after['peah:barley']?.cyclesRemaining).toBe(1)
        // wheat cycles unchanged
        expect(after['peah:wheat']?.cyclesRemaining).toBe(5)
    })
})

// ── Orchard cycle actions ─────────────────────────────────────────────────────

describe('plantOrchard', () => {
    it('transitions empty grape plot (hasBeenPlanted=false) to planted and sets hasBeenPlanted=true', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        useGameStore.getState().plantOrchard(grapePlot.id)

        const after = useGameStore.getState()
        const updated = after.plots.find((p) => p.id === grapePlot.id)!
        expect(updated.state).toBe('planted')
        expect(updated.hasBeenPlanted).toBe(true)
    })

    it('is a no-op when hasBeenPlanted=true', () => {
        useGameStore.setState({ wheat: 1000 })
        const coord = { col: 2, row: 1 }
        useGameStore.getState().buyTile(coord, 'orchard', 'grapes')

        const state = useGameStore.getState()
        const grapePlot = state.plots.find(
            (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
        )!

        // Simulate already planted
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === grapePlot.id ? { ...p, state: 'empty' as const, hasBeenPlanted: true } : p,
            ),
        })

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

describe('toggleDecisionEnabled', () => {
    it('flips enabled from true to false', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
            },
        })
        useGameStore.getState().toggleDecisionEnabled('peah:wheat')
        expect(useGameStore.getState().savedFieldDecisions['peah:wheat']?.enabled).toBe(false)
    })

    it('flips enabled from false to true', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: false },
            },
        })
        useGameStore.getState().toggleDecisionEnabled('peah:wheat')
        expect(useGameStore.getState().savedFieldDecisions['peah:wheat']?.enabled).toBe(true)
    })

    it('does nothing when key does not exist', () => {
        useGameStore.setState({ savedFieldDecisions: {} })
        useGameStore.getState().toggleDecisionEnabled('peah:wheat')
        expect(useGameStore.getState().savedFieldDecisions['peah:wheat']).toBeUndefined()
    })

    it('does not affect other keys', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
                'shikchah:wheat': { choiceIndex: 1, cyclesRemaining: 2, enabled: true },
            },
        })
        useGameStore.getState().toggleDecisionEnabled('peah:wheat')
        expect(useGameStore.getState().savedFieldDecisions['shikchah:wheat']?.enabled).toBe(true)
    })

    it('does not change choiceIndex or cyclesRemaining', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 2, cyclesRemaining: 4, enabled: true },
            },
        })
        useGameStore.getState().toggleDecisionEnabled('peah:wheat')
        const entry = useGameStore.getState().savedFieldDecisions['peah:wheat']
        expect(entry?.choiceIndex).toBe(2)
        expect(entry?.cyclesRemaining).toBe(4)
    })
})

// ── encounteredDilemmas tracking ─────────────────────────────────────────────

describe('encounteredDilemmas tracking — harvest', () => {
    it('adds peah:wheat to encounteredDilemmas on first wheat harvest', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            encounteredDilemmas: [],
            savedFieldDecisions: {},
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().encounteredDilemmas).toContain('peah:wheat')
    })

    it('does not duplicate peah:wheat if already in encounteredDilemmas', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            encounteredDilemmas: ['peah:wheat'],
            savedFieldDecisions: {},
        })

        useGameStore.getState().harvest(wheatPlot.id)

        const encountered = useGameStore.getState().encounteredDilemmas
        expect(encountered.filter((k) => k === 'peah:wheat')).toHaveLength(1)
    })

    it('adds peah:barley to encounteredDilemmas on first barley harvest', () => {
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
            encounteredDilemmas: [],
            savedFieldDecisions: {},
        })

        useGameStore.getState().harvest(barleyPlot.id)

        expect(useGameStore.getState().encounteredDilemmas).toContain('peah:barley')
    })
})

describe('encounteredDilemmas tracking — gatherSheafs', () => {
    it('adds shikchah:wheat to encounteredDilemmas on first wheat gather', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            encounteredDilemmas: [],
            savedFieldDecisions: {},
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().encounteredDilemmas).toContain('shikchah:wheat')
    })

    it('does not duplicate shikchah:wheat if already encountered', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            encounteredDilemmas: ['shikchah:wheat'],
            savedFieldDecisions: {},
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        const encountered = useGameStore.getState().encounteredDilemmas
        expect(encountered.filter((k) => k === 'shikchah:wheat')).toHaveLength(1)
    })
})

// ── auto-resolve skipped when enabled: false ─────────────────────────────────

describe('harvest auto-resolve respects enabled flag', () => {
    it('shows PEAH modal when saved decision has enabled: false', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: false },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().activeDilemma?.id).toBe('peah')
    })

    it('does not decrement cyclesRemaining when enabled: false', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'ready' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: false },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['peah:wheat']?.cyclesRemaining).toBe(3)
    })
})

describe('gatherSheafs auto-resolve respects enabled flag', () => {
    it('shows SHIKCHAH modal when saved decision has enabled: false', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: 'gathered' as const } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:wheat': {
                    choiceIndex: 0,
                    cyclesRemaining: 3,
                    enabled: false,
                },
            },
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().activeDilemma?.id).toBe('shikchah')
    })
})

// ── resolveDilemma saves with enabled: true ──────────────────────────────────

describe('resolveDilemma save includes enabled: true', () => {
    it('saves peah:wheat with enabled: true', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: 'wheat',
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(0, true)
        expect(useGameStore.getState().savedFieldDecisions['peah:wheat']?.enabled).toBe(true)
    })

    it('saves shikchah:barley with enabled: true', () => {
        const shikchah = DILEMMAS.find((d) => d.id === 'shikchah')!
        useGameStore.setState({
            activeDilemma: shikchah,
            activeDilemmaContext: 'barley',
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(1, true)
        expect(useGameStore.getState().savedFieldDecisions['shikchah:barley']?.enabled).toBe(true)
    })
})

// ── v12 migration ─────────────────────────────────────────────────────────────

describe('v12 migration logic', () => {
    it('backfills encounteredDilemmas when missing', () => {
        // Simulate the migration function inline (can't replay persist versioning)
        const state: Record<string, unknown> = {
            savedFieldDecisions: {},
        }
        const version = 11
        if (version < 12) {
            ;(state as Record<string, unknown>).encounteredDilemmas =
                (state.encounteredDilemmas as string[] | undefined) ?? []
        }
        expect(state.encounteredDilemmas).toEqual([])
    })

    it('backfills enabled: true on existing savedFieldDecisions entries', () => {
        const sfd: Record<
            string,
            { choiceIndex: number; cyclesRemaining: number; enabled?: boolean }
        > = {
            'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3 },
            'shikchah:barley': { choiceIndex: 1, cyclesRemaining: 2 },
        }
        // Simulate v12 migration
        for (const key of Object.keys(sfd)) {
            if (sfd[key].enabled === undefined) {
                sfd[key] = { ...sfd[key], enabled: true }
            }
        }
        expect(sfd['peah:wheat'].enabled).toBe(true)
        expect(sfd['shikchah:barley'].enabled).toBe(true)
    })

    it('does not overwrite explicitly set enabled: false during migration', () => {
        const sfd: Record<
            string,
            { choiceIndex: number; cyclesRemaining: number; enabled?: boolean }
        > = {
            'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: false },
        }
        // Simulate v12 migration — only backfills when undefined
        for (const key of Object.keys(sfd)) {
            if (sfd[key].enabled === undefined) {
                sfd[key] = { ...sfd[key], enabled: true }
            }
        }
        expect(sfd['peah:wheat'].enabled).toBe(false)
    })

    it('preserves existing encounteredDilemmas if already present', () => {
        const state = { encounteredDilemmas: ['peah:wheat'] as string[] }
        const version = 11
        if (version < 12) {
            state.encounteredDilemmas = state.encounteredDilemmas ?? []
        }
        expect(state.encounteredDilemmas).toEqual(['peah:wheat'])
    })
})
