import { describe, it, expect } from 'vitest'
import { tickPlot, growthProgress, stepWaitProgress } from './game-tick'
import type { Plot } from '@/types'

const makePlot = (overrides: Partial<Plot> = {}): Plot => ({
    id: '2_2_0',
    state: 'growing',
    plantedAt: Date.now(),
    growthDuration: 15_000,
    tileCoord: { col: 2, row: 2 },
    cropType: 'wheat',
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
        expect(result.state).toBe('ready')
    })

    it('leaves growing plot unchanged when growthDuration has not elapsed', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 5_000 })
        const result = tickPlot(plot, now)
        expect(result.state).toBe('growing')
    })

    it('transitions exactly at growthDuration boundary', () => {
        const now = Date.now()
        const plot = makePlot({ plantedAt: now - 15_000 })
        const result = tickPlot(plot, now)
        expect(result.state).toBe('ready')
    })

    it('does not modify plots that are not in growing state', () => {
        const emptyPlot = makePlot({ state: 'empty', plantedAt: null })
        expect(tickPlot(emptyPlot).state).toBe('empty')

        const plowedPlot = makePlot({ state: 'plowed', plantedAt: null })
        expect(tickPlot(plowedPlot).state).toBe('plowed')

        const plantedPlot = makePlot({
            state: 'planted',
            plantedAt: null,
            cropType: 'grapes',
        })
        expect(tickPlot(plantedPlot).state).toBe('planted')

        const fertilizedPlot = makePlot({
            state: 'fertilized',
            plantedAt: null,
            cropType: 'grapes',
        })
        expect(tickPlot(fertilizedPlot).state).toBe('fertilized')

        const tendedPlot = makePlot({
            state: 'tended',
            plantedAt: null,
            cropType: 'grapes',
        })
        expect(tickPlot(tendedPlot).state).toBe('tended')

        const readyPlot = makePlot({ state: 'ready' })
        expect(tickPlot(readyPlot).state).toBe('ready')

        const harvestedPlot = makePlot({ state: 'harvested' })
        expect(tickPlot(harvestedPlot).state).toBe('harvested')

        const gatheredPlot = makePlot({ state: 'gathered' })
        expect(tickPlot(gatheredPlot).state).toBe('gathered')
    })

    it('does not modify a growing plot with null plantedAt', () => {
        const plot = makePlot({ plantedAt: null })
        const result = tickPlot(plot)
        expect(result.state).toBe('growing')
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
            cropType: 'grapes',
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
            state: 'fertilized',
            plantedAt: null,
            cropType: 'grapes',
            nextActionAt: now - 1,
        })
        const result = tickPlot(plot, now)
        expect(result.nextActionAt).toBeNull()
    })

    it('clears nextActionAt exactly at the boundary', () => {
        const now = Date.now()
        const plot = makePlot({
            state: 'tended',
            plantedAt: null,
            cropType: 'grapes',
            nextActionAt: now,
        })
        const result = tickPlot(plot, now)
        expect(result.nextActionAt).toBeNull()
    })

    it('does not clear nextActionAt before its time', () => {
        const now = Date.now()
        const plot = makePlot({
            state: 'fertilized',
            plantedAt: null,
            cropType: 'grapes',
            nextActionAt: now + 5_000,
        })
        const result = tickPlot(plot, now)
        expect(result.nextActionAt).toBe(now + 5_000)
    })

    it('returns a new object reference when nextActionAt clears', () => {
        const now = Date.now()
        const plot = makePlot({
            state: 'fertilized',
            plantedAt: null,
            cropType: 'grapes',
            nextActionAt: now - 1,
        })
        const result = tickPlot(plot, now)
        expect(result).not.toBe(plot)
    })

    it('clears stepWaitDuration when nextActionAt clears', () => {
        const now = Date.now()
        const plot = makePlot({
            state: 'fertilized',
            plantedAt: null,
            cropType: 'grapes',
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
            state: 'growing',
            plantedAt: now - 20_000,
            growthDuration: 15_000,
            nextActionAt: now - 1,
        })
        const result = tickPlot(plot, now)
        // nextActionAt cleared; state still growing (will become ready next tick)
        expect(result.nextActionAt).toBeNull()
        expect(result.state).toBe('growing')
    })
})

describe('growthProgress', () => {
    it('returns 0 for non-growing plots', () => {
        expect(growthProgress(makePlot({ state: 'empty', plantedAt: null }))).toBe(0)
        expect(growthProgress(makePlot({ state: 'ready' }))).toBe(0)
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
