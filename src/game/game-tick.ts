import type { Plot } from '@/types'

// Pure function — no side effects, no store access.
// Takes a plot and the current timestamp; returns the updated plot.
// The store action calls this and sets state via Zustand.
export const tickPlot = (plot: Plot, now: number = Date.now()): Plot => {
    // Unlock next action when its timer has expired
    if (plot.nextActionAt !== null && now >= plot.nextActionAt) {
        return { ...plot, nextActionAt: null, stepWaitDuration: null }
    }
    if (plot.state !== 'growing') return plot
    if (plot.plantedAt === null) return plot

    const elapsed = now - plot.plantedAt
    if (elapsed >= plot.growthDuration) {
        return { ...plot, state: 'ready' }
    }
    return plot
}

// Returns growth progress as a value in [0, 1].
// Useful for rendering circular progress without importing store.
export const growthProgress = (plot: Plot, now: number = Date.now()): number => {
    if (plot.state !== 'growing' || plot.plantedAt === null) return 0
    return Math.min(1, (now - plot.plantedAt) / plot.growthDuration)
}

// Returns orchard step-wait progress as a value in [0, 1].
// Returns 0 when no wait is active (nextActionAt or stepWaitDuration is null).
export const stepWaitProgress = (plot: Plot, now: number = Date.now()): number => {
    if (plot.nextActionAt === null || plot.stepWaitDuration === null) return 0
    const startedAt = plot.nextActionAt - plot.stepWaitDuration
    return Math.min(1, (now - startedAt) / plot.stepWaitDuration)
}
