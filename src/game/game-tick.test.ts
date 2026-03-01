import { describe, it, expect } from 'vitest'
import { tickPlot, growthProgress, stepWaitProgress } from './game-tick'
import type { Plot } from '@/types'
import { PlotState, CropType } from '@/types'

const makePlot = (overrides: Partial<Plot> = {}): Plot => ({
    id: '2_2_0',
    state: PlotState.Growing,
    plantedAt: Date.now(),
    growthDuration: 15_000,
    tileCoord: { col: 2, row: 2 },
    cropType: CropType.Wheat,
    hasBeenPlanted: false,
    nextActionAt: null,
    stepWaitDuration: null,
    harvestCount: 0,
    ...overrides,
})

describe('tickPlot', () => {
    it('transitions growing plot to ready after growthDuration has elapsed', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 16_000 })
        const result = tickPlot(plot, now)
        expect(result.state).toBe(PlotState.Ready)
    })

    it('leaves growing plot unchanged when growthDuration has not elapsed', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 5_000 })
        const result = tickPlot(plot, now)
        expect(result.state).toBe(PlotState.Growing)
    })

    it('transitions exactly at growthDuration boundary', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 15_000 })
        const result = tickPlot(plot, now)
        expect(result.state).toBe(PlotState.Ready)
    })

    it('does not modify plots that are not in growing state', () => {
        const emptyPlot = makePlot({ state: PlotState.Empty, plantedAt: null })
        expect(tickPlot(emptyPlot).state).toBe(PlotState.Empty)

        const plowedPlot = makePlot({ state: PlotState.Plowed, plantedAt: null })
        expect(tickPlot(plowedPlot).state).toBe(PlotState.Plowed)

        const plantedPlot = makePlot({
            state: PlotState.Planted,
            plantedAt: null,
            cropType: CropType.Grapes,
        })
        expect(tickPlot(plantedPlot).state).toBe(PlotState.Planted)

        const fertilizedPlot = makePlot({
            state: PlotState.Fertilized,
            plantedAt: null,
            cropType: CropType.Grapes,
        })
        expect(tickPlot(fertilizedPlot).state).toBe(PlotState.Fertilized)

        const tendedPlot = makePlot({
            state: PlotState.Tended,
            plantedAt: null,
            cropType: CropType.Grapes,
        })
        expect(tickPlot(tendedPlot).state).toBe(PlotState.Tended)

        const readyPlot = makePlot({ state: PlotState.Ready })
        expect(tickPlot(readyPlot).state).toBe(PlotState.Ready)

        const harvestedPlot = makePlot({ state: PlotState.Harvested })
        expect(tickPlot(harvestedPlot).state).toBe(PlotState.Harvested)

        const gatheredPlot = makePlot({ state: PlotState.Gathered })
        expect(tickPlot(gatheredPlot).state).toBe(PlotState.Gathered)
    })

    it('does not modify a growing plot with null plantedAt', () => {
        const plot = makePlot({ plantedAt: null })
        const result = tickPlot(plot)
        expect(result.state).toBe(PlotState.Growing)
    })

    it('returns a new object reference on state change', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 20_000 })
        const result = tickPlot(plot, now)
        expect(result).not.toBe(plot)
    })

    it('returns the same object reference when state does not change', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 1_000 })
        const result = tickPlot(plot, now)
        expect(result).toBe(plot)
    })

    it('does not modify harvestCount', () => {
        const now = Date.now()
        const plot = makePlot({
            plantedAt: now - 5_000,
            growthDuration: 10_000,
            cropType: CropType.Grapes,
            hasBeenPlanted: true,
            harvestCount: 7,
        })
        const result = tickPlot(plot, now)
        expect(result.harvestCount).toBe(7)
    })
})

describe('tickPlot — nextActionAt unlock', () => {
    it('clears nextActionAt when its time has passed', () => {
        const now = Date.now()
        const plot = makePlot({
            state: PlotState.Fertilized,
            plantedAt: null,
            cropType: CropType.Grapes,
            nextActionAt: now - 1,
        })
        const result = tickPlot(plot, now)
        expect(result.nextActionAt).toBeNull()
    })

    it('clears nextActionAt exactly at the boundary', () => {
        const now = Date.now()
        const plot = makePlot({
            state: PlotState.Tended,
            plantedAt: null,
            cropType: CropType.Grapes,
            nextActionAt: now,
        })
        const result = tickPlot(plot, now)
        expect(result.nextActionAt).toBeNull()
    })

    it('does not clear nextActionAt before its time', () => {
        const now = Date.now()
        const plot = makePlot({
            state: PlotState.Fertilized,
            plantedAt: null,
            cropType: CropType.Grapes,
            nextActionAt: now + 5_000,
        })
        const result = tickPlot(plot, now)
        expect(result.nextActionAt).toBe(now + 5_000)
    })

    it('returns a new object reference when nextActionAt clears', () => {
        const now = Date.now()
        const plot = makePlot({
            state: PlotState.Fertilized,
            plantedAt: null,
            cropType: CropType.Grapes,
            nextActionAt: now - 1,
        })
        const result = tickPlot(plot, now)
        expect(result).not.toBe(plot)
    })

    it('clears stepWaitDuration when nextActionAt clears', () => {
        const now = Date.now()
        const plot = makePlot({
            state: PlotState.Fertilized,
            plantedAt: null,
            cropType: CropType.Grapes,
            nextActionAt: now - 1,
            stepWaitDuration: 10_000,
        })
        const result = tickPlot(plot, now)
        expect(result.nextActionAt).toBeNull()
        expect(result.stepWaitDuration).toBeNull()
    })

    it('does not advance growing→ready while nextActionAt is pending (clear happens first)', () => {
        // A growing plot with both nextActionAt pending and growth complete:
        // nextActionAt clear takes priority in the first tick, ready on the next.
        const now = Date.now()
        const plot = makePlot({
            state: PlotState.Growing,
            plantedAt: now - 20_000,
            growthDuration: 15_000,
            nextActionAt: now - 1,
        })
        const result = tickPlot(plot, now)
        // nextActionAt cleared; state still growing (will become ready next tick)
        expect(result.nextActionAt).toBeNull()
        expect(result.state).toBe(PlotState.Growing)
    })
})

describe('growthProgress', () => {
    it('returns 0 for non-growing plots', () => {
        expect(growthProgress(makePlot({ state: PlotState.Empty, plantedAt: null }))).toBe(0)
        expect(growthProgress(makePlot({ state: PlotState.Ready }))).toBe(0)
    })

    it('returns 0 for growing plot with null plantedAt', () => {
        expect(growthProgress(makePlot({ plantedAt: null }))).toBe(0)
    })

    it('returns value between 0 and 1 during growth', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 7_500 }) // halfway through 15s
        const progress = growthProgress(plot, now)
        expect(progress).toBeCloseTo(0.5)
    })

    it('clamps to 1 when past growthDuration', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 30_000 })
        expect(growthProgress(plot, now)).toBe(1)
    })
})

describe('stepWaitProgress', () => {
    it('returns 0 when nextActionAt is null', () => {
        const plot = makePlot({ nextActionAt: null, stepWaitDuration: 10_000 })
        expect(stepWaitProgress(plot)).toBe(0)
    })

    it('returns 0 when stepWaitDuration is null', () => {
        const now = Date.now()
        const plot = makePlot({ nextActionAt: now + 5_000, stepWaitDuration: null })
        expect(stepWaitProgress(plot, now)).toBe(0)
    })

    it('returns ~0 at the very start of the wait', () => {
        const now = Date.now()
        const duration = 10_000
        const plot = makePlot({ nextActionAt: now + duration, stepWaitDuration: duration })
        expect(stepWaitProgress(plot, now)).toBeCloseTo(0, 1)
    })

    it('returns ~0.5 halfway through the wait', () => {
        const duration = 10_000
        const startedAt = Date.now() - duration / 2
        const plot = makePlot({
            nextActionAt: startedAt + duration,
            stepWaitDuration: duration,
        })
        expect(stepWaitProgress(plot, startedAt + duration / 2)).toBeCloseTo(0.5)
    })

    it('clamps to 1 when past duration', () => {
        const duration = 10_000
        const startedAt = Date.now() - duration * 2
        const plot = makePlot({
            nextActionAt: startedAt + duration,
            stepWaitDuration: duration,
        })
        expect(stepWaitProgress(plot, startedAt + duration * 2)).toBe(1)
    })
})
