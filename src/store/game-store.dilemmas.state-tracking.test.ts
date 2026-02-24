import { beforeEach, describe, expect, it } from 'vitest'
import { DILEMMAS } from '@/game/dilemmas'
import { useGameStore } from './game-store'
import { buyTileWithWheat, findPlotByCoord, resetGameStore } from '@/test-utils/game-store'

beforeEach(() => {
    resetGameStore()
})

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

describe('encounteredDilemmas tracking on harvest', () => {
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

describe('encounteredDilemmas tracking on gatherSheafs', () => {
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

describe('auto-resolve respects enabled flag', () => {
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

    it('does not decrement cyclesRemaining when PEAH enabled: false', () => {
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
