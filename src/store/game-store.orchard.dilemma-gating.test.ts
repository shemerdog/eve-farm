import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import type { Plot } from '@/types'
import { PlotState, CropType, TileCategory } from '@/types'
import { useGameStore } from './game-store'
import { resetGameStore } from '@/test-utils/game-store'

beforeEach(() => {
    resetGameStore()
})

function setupOrchardPlot(harvestCount = 0): string {
    const coord = { col: 3, row: 2 }
    const plotId = '3_2_0'
    const plot: Plot = {
        id: plotId,
        state: PlotState.Ready,
        plantedAt: Date.now() - 100_000,
        growthDuration: 30_000,
        tileCoord: coord,
        cropType: CropType.Grapes,
        hasBeenPlanted: true,
        nextActionAt: null,
        stepWaitDuration: null,
        harvestCount,
    }
    useGameStore.setState({
        ...useGameStore.getState(),
        tileCategories: { '3_2': TileCategory.Orchard },
        activeDilemma: null,
        activeDilemmaContext: null,
        activePlotId: null,
        plots: [plot],
        grapes: 0,
    })
    return plotId
}

describe('harvest orchard cycle gating', () => {
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

    it('shows PERET_OLLELOT from cycle 5 onwards (harvestCount >= 4)', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('peret_ollelot')
        expect(useGameStore.getState().activePlotId).toBe(plotId)
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
                    state: PlotState.Ready,
                    plantedAt: Date.now() - 100_000,
                    growthDuration: 15_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: CropType.Wheat,
                    hasBeenPlanted: false,
                    nextActionAt: null,
                    stepWaitDuration: null,
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
                    state: PlotState.Ready,
                    plantedAt: Date.now() - 100_000,
                    growthDuration: 15_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: CropType.Wheat,
                    hasBeenPlanted: false,
                    nextActionAt: null,
                    stepWaitDuration: null,
                    harvestCount: 0,
                },
            ],
        })
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('peah')
    })
})

describe('resolveDilemma orchard skip-gather behavior', () => {
    it('ORLAH choice 0 resets plot to empty immediately, no grapes added', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('orlah')

        useGameStore.getState().resolveDilemma(0)

        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe(PlotState.Empty)
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

    it('ORLAH choice 1 does not reset plot and gather step is still needed', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(1)
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe(PlotState.Harvested)
        expect(useGameStore.getState().activePlotId).toBeNull()
    })

    it('NETA_REVAI choice 0 resets plot to empty, no grapes added', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('neta_revai')

        useGameStore.getState().resolveDilemma(0)

        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe(PlotState.Empty)
        expect(useGameStore.getState().grapes).toBe(0)
        expect(useGameStore.getState().activePlotId).toBeNull()
    })

    it('NETA_REVAI choice 1 does not reset plot and gather step is still needed', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(1)
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe(PlotState.Harvested)
    })

    it('activePlotId is cleared on every resolveDilemma call', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activePlotId).toBe(plotId)
        useGameStore.getState().resolveDilemma(2)
        expect(useGameStore.getState().activePlotId).toBeNull()
    })
})

describe('PERET_OLLELOT dilemma (cycle 5+, harvestCount >= 4)', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('fires PERET_OLLELOT on harvestCount 4 (cycle 5)', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('peret_ollelot')
    })

    it('fires PERET_OLLELOT on harvestCount 10 (cycle 11)', () => {
        const plotId = setupOrchardPlot(10)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('peret_ollelot')
    })

    it('does NOT fire PERET_OLLELOT on cycle 4 (NETA_REVAI fires instead)', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('neta_revai')
    })

    it('choice 0 deducts 5 grapes; morality +10, devotion +8', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.setState({
            ...useGameStore.getState(),
            grapes: 20,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
        })
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(0)
        expect(useGameStore.getState().grapes).toBe(15) // 20 - 5
        expect(useGameStore.getState().meters.morality).toBe(60) // +10
        expect(useGameStore.getState().meters.devotion).toBe(58) // +8
    })

    it('choice 1 deducts 2 grapes; morality +5, devotion +3', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.setState({
            ...useGameStore.getState(),
            grapes: 20,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
        })
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(1)
        expect(useGameStore.getState().grapes).toBe(18) // 20 - 2
        expect(useGameStore.getState().meters.morality).toBe(55) // +5
        expect(useGameStore.getState().meters.devotion).toBe(53) // +3
    })

    it('choice 2 deducts 2 grapes; morality +5, devotion +3', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.setState({
            ...useGameStore.getState(),
            grapes: 20,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
        })
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(2)
        expect(useGameStore.getState().grapes).toBe(18) // 20 - 2
        expect(useGameStore.getState().meters.morality).toBe(55) // +5
        expect(useGameStore.getState().meters.devotion).toBe(53) // +3
    })

    it('choice 3 deducts 0 grapes; morality -8, devotion -5', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.setState({
            ...useGameStore.getState(),
            grapes: 20,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
        })
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(3)
        expect(useGameStore.getState().grapes).toBe(20) // unchanged
        expect(useGameStore.getState().meters.morality).toBe(42) // -8
        expect(useGameStore.getState().meters.devotion).toBe(45) // -5
    })

    it('adds peret_ollelot:Grapes to encounteredDilemmas on first cycle-5 harvest', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.setState({ ...useGameStore.getState(), encounteredDilemmas: [] })
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().encounteredDilemmas).toContain('peret_ollelot:Grapes')
    })

    it('does not add peret_ollelot:Grapes to encounteredDilemmas on cycle 4 (NETA_REVAI)', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.setState({ ...useGameStore.getState(), encounteredDilemmas: [] })
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().encounteredDilemmas).not.toContain('peret_ollelot:Grapes')
    })

    it('peret_ollelot is saveable — resolveDilemma with save=true stores decision', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(0, true)
        const saved = useGameStore.getState().savedFieldDecisions['peret_ollelot:Grapes']
        expect(saved).toBeDefined()
        expect(saved?.choiceIndex).toBe(0)
        expect(saved?.cyclesRemaining).toBe(5)
    })

    it('saved peret_ollelot decision auto-resolves on next cycle-5+ harvest', () => {
        const plotId = setupOrchardPlot(4)
        useGameStore.setState({
            ...useGameStore.getState(),
            grapes: 30,
            savedFieldDecisions: {
                'peret_ollelot:Grapes': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
            },
        })
        useGameStore.getState().harvest(plotId)
        // Should have auto-resolved — no modal
        expect(useGameStore.getState().activeDilemma).toBeNull()
        // Grapes should have been deducted
        expect(useGameStore.getState().grapes).toBe(25) // 30 - 5
    })

    it('saved peret_ollelot decision decrements cyclesRemaining on auto-resolve', () => {
        useGameStore.setState({
            ...useGameStore.getState(),
            savedFieldDecisions: {
                'peret_ollelot:Grapes': { choiceIndex: 1, cyclesRemaining: 3, enabled: true },
            },
        })
        const plotId = setupOrchardPlot(4)
        useGameStore.getState().harvest(plotId)
        expect(
            useGameStore.getState().savedFieldDecisions['peret_ollelot:Grapes']?.cyclesRemaining,
        ).toBe(2)
    })

    it('PEAH on barley harvest deducts barley (not wheat)', () => {
        const plotId = '2_2_0'
        useGameStore.setState({
            ...useGameStore.getState(),
            tileCategories: {},
            activeDilemma: null,
            savedFieldDecisions: {},
            wheat: 50,
            barley: 50,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            plots: [
                {
                    id: plotId,
                    state: PlotState.Ready,
                    plantedAt: Date.now() - 100_000,
                    growthDuration: 20_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: CropType.Barley,
                    hasBeenPlanted: false,
                    nextActionAt: null,
                    stepWaitDuration: null,
                    harvestCount: 0,
                },
            ],
        })
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('peah')

        // Resolve with choice 0 (cropCost=3)
        useGameStore.getState().resolveDilemma(0)
        expect(useGameStore.getState().barley).toBe(47) // 50 - 3
        expect(useGameStore.getState().wheat).toBe(50) // unchanged
    })
})
