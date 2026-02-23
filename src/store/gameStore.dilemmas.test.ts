import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import { DILEMMAS, ORLAH_DILEMMA } from '@/game/dilemmas'
import { buyTileWithWheat, findPlotByCoord, resetGameStore } from '@/test-utils/gameStore'

beforeEach(() => {
    resetGameStore()
})

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
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, 'field', 'barley')
        const state = useGameStore.getState()
        const barleyPlot = findPlotByCoord(coord)
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
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, 'field', 'barley')
        const state = useGameStore.getState()
        const barleyPlot = findPlotByCoord(coord)
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
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, 'field', 'barley')
        const state = useGameStore.getState()
        const barleyPlot = findPlotByCoord(coord)
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
