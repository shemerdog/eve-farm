import { beforeEach, describe, expect, it } from 'vitest'
import { DILEMMAS } from '@/game/dilemmas'
import { useGameStore } from './game-store'
import { buyTileWithWheat, findPlotByCoord, resetGameStore } from '@/test-utils/game-store'
import { TileCategory, TileSubcategory, PlotState, CropType } from '@/types'

beforeEach(() => {
    resetGameStore()
})

describe('toggleDecisionEnabled', () => {
    it('flips enabled from true to false', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
            },
        })
        useGameStore.getState().toggleDecisionEnabled('peah:Wheat')
        expect(useGameStore.getState().savedFieldDecisions['peah:Wheat']?.enabled).toBe(false)
    })

    it('flips enabled from false to true', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: false },
            },
        })
        useGameStore.getState().toggleDecisionEnabled('peah:Wheat')
        expect(useGameStore.getState().savedFieldDecisions['peah:Wheat']?.enabled).toBe(true)
    })

    it('does nothing when key does not exist', () => {
        useGameStore.setState({ savedFieldDecisions: {} })
        useGameStore.getState().toggleDecisionEnabled('peah:Wheat')
        expect(useGameStore.getState().savedFieldDecisions['peah:Wheat']).toBeUndefined()
    })

    it('does not affect other keys', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
                'shikchah:Wheat': { choiceIndex: 1, cyclesRemaining: 2, enabled: true },
            },
        })
        useGameStore.getState().toggleDecisionEnabled('peah:Wheat')
        expect(useGameStore.getState().savedFieldDecisions['shikchah:Wheat']?.enabled).toBe(true)
    })

    it('does not change choiceIndex or cyclesRemaining', () => {
        useGameStore.setState({
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 2, cyclesRemaining: 4, enabled: true },
            },
        })
        useGameStore.getState().toggleDecisionEnabled('peah:Wheat')
        const entry = useGameStore.getState().savedFieldDecisions['peah:Wheat']
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
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            encounteredDilemmas: [],
            savedFieldDecisions: {},
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().encounteredDilemmas).toContain('peah:Wheat')
    })

    it('does not duplicate peah:wheat if already in encounteredDilemmas', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            encounteredDilemmas: ['peah:Wheat'],
            savedFieldDecisions: {},
        })

        useGameStore.getState().harvest(wheatPlot.id)

        const encountered = useGameStore.getState().encounteredDilemmas
        expect(encountered.filter((k) => k === 'peah:Wheat')).toHaveLength(1)
    })

    it('adds peah:barley to encounteredDilemmas on first barley harvest', () => {
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, TileCategory.Field, TileSubcategory.Barley)
        const state = useGameStore.getState()
        const barleyPlot = findPlotByCoord(coord)
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            encounteredDilemmas: [],
            savedFieldDecisions: {},
        })

        useGameStore.getState().harvest(barleyPlot.id)

        expect(useGameStore.getState().encounteredDilemmas).toContain('peah:Barley')
    })
})

describe('encounteredDilemmas tracking on gatherSheafs', () => {
    it('adds shikchah:wheat to encounteredDilemmas on first wheat gather', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Gathered } : p,
            ),
            encounteredDilemmas: [],
            savedFieldDecisions: {},
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        expect(useGameStore.getState().encounteredDilemmas).toContain('shikchah:Wheat')
    })

    it('does not duplicate shikchah:wheat if already encountered', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Gathered } : p,
            ),
            encounteredDilemmas: ['shikchah:Wheat'],
            savedFieldDecisions: {},
        })

        useGameStore.getState().gatherSheafs(wheatPlot.id)

        const encountered = useGameStore.getState().encounteredDilemmas
        expect(encountered.filter((k) => k === 'shikchah:Wheat')).toHaveLength(1)
    })
})

describe('auto-resolve respects enabled flag', () => {
    it('shows PEAH modal when saved decision has enabled: false', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: false },
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
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: false },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['peah:Wheat']?.cyclesRemaining).toBe(3)
    })

    it('shows SHIKCHAH modal when saved decision has enabled: false', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Gathered } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'shikchah:Wheat': {
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
            activeDilemmaContext: CropType.Wheat,
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(0, true)
        expect(useGameStore.getState().savedFieldDecisions['peah:Wheat']?.enabled).toBe(true)
    })

    it('saves shikchah:barley with enabled: true', () => {
        const shikchah = DILEMMAS.find((d) => d.id === 'shikchah')!
        useGameStore.setState({
            activeDilemma: shikchah,
            activeDilemmaContext: CropType.Barley,
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(1, true)
        expect(useGameStore.getState().savedFieldDecisions['shikchah:Barley']?.enabled).toBe(true)
    })
})
