import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './game-store'
import { DILEMMAS, ORLAH_DILEMMA } from '@/game/dilemmas'
import { buyTileWithWheat, findPlotByCoord, resetGameStore } from '@/test-utils/game-store'
import { TileCategory, TileSubcategory, CropType, PlotState } from '@/types'

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
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 5, enabled: true },
                'peah:Barley': { choiceIndex: 1, cyclesRemaining: 3, enabled: true },
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
            activeDilemmaContext: CropType.Wheat,
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(0, true)

        const saved = useGameStore.getState().savedFieldDecisions['peah:Wheat']
        expect(saved).toBeDefined()
        expect(saved?.choiceIndex).toBe(0)
        expect(saved?.cyclesRemaining).toBe(5)
    })

    it('saves peah:barley decision independently from peah:wheat', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: CropType.Barley,
            wheat: 100,
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 2, cyclesRemaining: 3, enabled: true },
            },
        })
        useGameStore.getState().resolveDilemma(1, true)

        const state = useGameStore.getState().savedFieldDecisions
        expect(state['peah:Barley']?.choiceIndex).toBe(1)
        expect(state['peah:Barley']?.cyclesRemaining).toBe(5)
        // wheat decision unchanged
        expect(state['peah:Wheat']?.choiceIndex).toBe(2)
        expect(state['peah:Wheat']?.cyclesRemaining).toBe(3)
    })

    it('clears activeDilemma after resolving with save', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: CropType.Wheat,
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(1, true)
        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('clears activeDilemmaContext after resolving', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: CropType.Wheat,
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
            activeDilemmaContext: CropType.Wheat,
            wheat: 100,
        })
        useGameStore.getState().resolveDilemma(1, true)

        const saved = useGameStore.getState().savedFieldDecisions['shikchah:Wheat']
        expect(saved).toBeDefined()
        expect(saved?.choiceIndex).toBe(1)
        expect(saved?.cyclesRemaining).toBe(5)
    })

    it('saves shikchah:barley decision independently from shikchah:wheat', () => {
        const shikchah = DILEMMAS.find((d) => d.id === 'shikchah')!
        useGameStore.setState({
            activeDilemma: shikchah,
            activeDilemmaContext: CropType.Barley,
            wheat: 100,
            savedFieldDecisions: {
                'shikchah:Wheat': { choiceIndex: 2, cyclesRemaining: 4, enabled: true },
            },
        })
        useGameStore.getState().resolveDilemma(0, true)

        const state = useGameStore.getState().savedFieldDecisions
        expect(state['shikchah:Barley']?.choiceIndex).toBe(0)
        expect(state['shikchah:Barley']?.cyclesRemaining).toBe(5)
        // wheat decision unchanged
        expect(state['shikchah:Wheat']?.choiceIndex).toBe(2)
        expect(state['shikchah:Wheat']?.cyclesRemaining).toBe(4)
    })
})

describe('resolveDilemma without save (default)', () => {
    it('does not save when save omitted', () => {
        const peah = DILEMMAS.find((d) => d.id === 'peah')!
        useGameStore.setState({
            activeDilemma: peah,
            activeDilemmaContext: CropType.Wheat,
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
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
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
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['peah:Wheat']?.cyclesRemaining).toBe(2)
    })

    it('removes saved decision when cyclesRemaining reaches 0', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 1, enabled: true },
            },
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().savedFieldDecisions['peah:Wheat']).toBeUndefined()
    })

    it('shows PEAH modal when no saved decision exists', () => {
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {},
        })

        useGameStore.getState().harvest(wheatPlot.id)

        expect(useGameStore.getState().activeDilemma?.id).toBe('peah')
    })

    it('applies wheat cost and meter effects when auto-resolving PEAH choice 0', () => {
        // PEAH choice 0: cropCost=3, morality+10, devotion+5
        const state = useGameStore.getState()
        const wheatPlot = state.plots[0]
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === wheatPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            wheat: 100,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 0, cyclesRemaining: 2, enabled: true },
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
        buyTileWithWheat(coord, TileCategory.Field, TileSubcategory.Barley)
        const state = useGameStore.getState()
        const barleyPlot = findPlotByCoord(coord)
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:Barley': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
            },
        })

        useGameStore.getState().harvest(barleyPlot.id)

        expect(useGameStore.getState().activeDilemma).toBeNull()
    })

    it('barley saved decision does not consume wheat saved decision', () => {
        const coord = { col: 2, row: 1 }
        buyTileWithWheat(coord, TileCategory.Field, TileSubcategory.Barley)
        const state = useGameStore.getState()
        const barleyPlot = findPlotByCoord(coord)
        useGameStore.setState({
            plots: state.plots.map((p) =>
                p.id === barleyPlot.id ? { ...p, state: PlotState.Ready } : p,
            ),
            activeDilemma: null,
            savedFieldDecisions: {
                'peah:Wheat': { choiceIndex: 1, cyclesRemaining: 5, enabled: true },
                'peah:Barley': { choiceIndex: 0, cyclesRemaining: 2, enabled: true },
            },
        })

        useGameStore.getState().harvest(barleyPlot.id)

        const after = useGameStore.getState().savedFieldDecisions
        // barley cycles decremented
        expect(after['peah:Barley']?.cyclesRemaining).toBe(1)
        // wheat cycles unchanged
        expect(after['peah:Wheat']?.cyclesRemaining).toBe(5)
    })
})
