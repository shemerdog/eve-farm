import { beforeEach, describe, expect, it } from 'vitest'
import type { Plot } from '@/types'
import { useGameStore } from './gameStore'
import { resetGameStore } from '@/test-utils/gameStore'

beforeEach(() => {
    resetGameStore()
})

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

describe('resolveDilemma orchard skip-gather behavior', () => {
    it('ORLAH choice 0 resets plot to empty immediately, no grapes added', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('orlah')

        useGameStore.getState().resolveDilemma(0)

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

    it('ORLAH choice 1 does not reset plot and gather step is still needed', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(1)
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe('harvested')
        expect(useGameStore.getState().activePlotId).toBeNull()
    })

    it('NETA_REVAI choice 0 resets plot to empty, no grapes added', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activeDilemma?.id).toBe('neta_revai')

        useGameStore.getState().resolveDilemma(0)

        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe('empty')
        expect(useGameStore.getState().grapes).toBe(0)
        expect(useGameStore.getState().activePlotId).toBeNull()
    })

    it('NETA_REVAI choice 1 does not reset plot and gather step is still needed', () => {
        const plotId = setupOrchardPlot(3)
        useGameStore.getState().harvest(plotId)
        useGameStore.getState().resolveDilemma(1)
        const plot = useGameStore.getState().plots.find((p) => p.id === plotId)
        expect(plot?.state).toBe('harvested')
    })

    it('activePlotId is cleared on every resolveDilemma call', () => {
        const plotId = setupOrchardPlot(0)
        useGameStore.getState().harvest(plotId)
        expect(useGameStore.getState().activePlotId).toBe(plotId)
        useGameStore.getState().resolveDilemma(2)
        expect(useGameStore.getState().activePlotId).toBeNull()
    })
})
