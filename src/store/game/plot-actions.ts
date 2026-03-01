import { CropType, PlotState } from '@/types'
import { FERTILIZE_WAIT_DURATION, TEND_WAIT_DURATION } from '@/game/constants'
import { tickPlot } from '@/game/game-tick'
import type { GameActions, SetState } from './store-types'

export const createPlotActions = (
    set: SetState,
): Pick<
    GameActions,
    | 'plowPlot'
    | 'plantWheat'
    | 'plantOrchard'
    | 'fertilizePlot'
    | 'tendPlot'
    | 'thinShoots'
    | 'tickGrowth'
> => ({
    plowPlot: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && p.state === PlotState.Empty
                    ? { ...p, state: PlotState.Plowed }
                    : p,
            ),
        }))
    },

    plantWheat: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && p.state === PlotState.Plowed
                    ? { ...p, state: PlotState.Growing, plantedAt: Date.now() }
                    : p,
            ),
        }))
    },

    plantOrchard: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && p.state === PlotState.Empty && !p.hasBeenPlanted
                    ? { ...p, state: PlotState.Planted, hasBeenPlanted: true }
                    : p,
            ),
        }))
    },

    fertilizePlot: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId &&
                (p.state === PlotState.Planted || (p.state === PlotState.Empty && p.hasBeenPlanted))
                    ? {
                          ...p,
                          state: PlotState.Fertilized,
                          nextActionAt: Date.now() + FERTILIZE_WAIT_DURATION,
                          stepWaitDuration: FERTILIZE_WAIT_DURATION,
                      }
                    : p,
            ),
        }))
    },

    tendPlot: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) => {
                if (p.id !== plotId || p.state !== PlotState.Fertilized || p.nextActionAt !== null)
                    return p
                // Grapes require shoot thinning next; other orchards go straight to growing.
                if (p.cropType === CropType.Grapes) {
                    return {
                        ...p,
                        state: PlotState.Tended,
                        nextActionAt: Date.now() + TEND_WAIT_DURATION,
                        stepWaitDuration: TEND_WAIT_DURATION,
                    }
                }
                return {
                    ...p,
                    state: PlotState.Growing,
                    plantedAt: Date.now(),
                    nextActionAt: null,
                }
            }),
        }))
    },

    thinShoots: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId &&
                p.state === PlotState.Tended &&
                p.cropType === CropType.Grapes &&
                p.nextActionAt === null
                    ? { ...p, state: PlotState.Growing, plantedAt: Date.now() }
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
