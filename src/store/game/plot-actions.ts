import {
    FERTILIZE_WAIT_DURATION,
    TEND_WAIT_DURATION,
} from '@/game/constants'
import { tickPlot } from '@/game/game-tick'
import type { GameActions, SetState } from './store-types'

export const createPlotActions = (set: SetState): Pick<
    GameActions,
    'plowPlot' | 'plantWheat' | 'plantOrchard' | 'fertilizePlot' | 'tendPlot' | 'thinShoots' | 'tickGrowth'
> => ({
    plowPlot: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && p.state === 'empty' ? { ...p, state: 'plowed' } : p,
            ),
        }))
    },

    plantWheat: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && p.state === 'plowed'
                    ? { ...p, state: 'growing', plantedAt: Date.now() }
                    : p,
            ),
        }))
    },

    plantOrchard: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && p.state === 'empty' && !p.hasBeenPlanted
                    ? { ...p, state: 'planted', hasBeenPlanted: true }
                    : p,
            ),
        }))
    },

    fertilizePlot: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && (p.state === 'planted' || (p.state === 'empty' && p.hasBeenPlanted))
                    ? {
                          ...p,
                          state: 'fertilized',
                          nextActionAt: Date.now() + FERTILIZE_WAIT_DURATION,
                      }
                    : p,
            ),
        }))
    },

    tendPlot: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) => {
                if (p.id !== plotId || p.state !== 'fertilized' || p.nextActionAt !== null) return p
                // Grapes require shoot thinning next; other orchards go straight to growing.
                if (p.cropType === 'grapes') {
                    return {
                        ...p,
                        state: 'tended',
                        nextActionAt: Date.now() + TEND_WAIT_DURATION,
                    }
                }
                return {
                    ...p,
                    state: 'growing',
                    plantedAt: Date.now(),
                    nextActionAt: null,
                }
            }),
        }))
    },

    thinShoots: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && p.state === 'tended' && p.cropType === 'grapes' && p.nextActionAt === null
                    ? { ...p, state: 'growing', plantedAt: Date.now() }
                    : p,
            ),
        }))
    },

    tickGrowth: (): void => {
        const now = Date.now()
        set((s) => ({
            plots: s.plots.map((p) => tickPlot(p, now)),
        }))
    },
})
