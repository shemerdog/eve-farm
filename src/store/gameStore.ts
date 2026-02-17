import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Plot, MeterValues } from '@/types'
import {
  PLOT_COUNT,
  WHEAT_GROWTH_DURATION,
  WHEAT_PER_HARVEST,
  HARVESTS_TO_TRIGGER_DILEMMA,
  METER_INITIAL,
  applyWheatCost,
  clampMeter,
} from '@/game/constants'
import { tickPlot } from '@/game/gameTick'
import { DILEMMAS } from '@/game/dilemmas'

const makePlots = (): Plot[] =>
  Array.from({ length: PLOT_COUNT }, (_, i) => ({
    id: i,
    state: 'empty',
    plantedAt: null,
    growthDuration: WHEAT_GROWTH_DURATION,
  }))

const initialState: GameState = {
  plots: makePlots(),
  wheat: 0,
  meters: { ...METER_INITIAL },
  activeDilemma: null,
  harvestsSinceLastDilemma: 0,
  dilemmaIndex: 0,
}

type Actions = {
  plantWheat: (plotId: number) => void
  tickGrowth: () => void
  harvest: (plotId: number) => void
  resolveDilemma: (choiceIndex: number) => void
  resetPlot: (plotId: number) => void
}

export const useGameStore = create<GameState & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      plantWheat: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId && p.state === 'empty'
              ? { ...p, state: 'growing', plantedAt: Date.now() }
              : p
          ),
        }))
      },

      tickGrowth: () => {
        const now = Date.now()
        set((s) => ({
          plots: s.plots.map((p) => tickPlot(p, now)),
        }))
      },

      harvest: (plotId) => {
        const state = get()
        const plot = state.plots.find((p) => p.id === plotId)
        if (!plot || plot.state !== 'ready') return

        const newHarvestCount = state.harvestsSinceLastDilemma + 1
        const shouldTrigger =
          newHarvestCount >= HARVESTS_TO_TRIGGER_DILEMMA && state.activeDilemma === null

        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId ? { ...p, state: 'harvested' } : p
          ),
          wheat: s.wheat + WHEAT_PER_HARVEST,
          harvestsSinceLastDilemma: shouldTrigger ? 0 : newHarvestCount,
          activeDilemma: shouldTrigger
            ? DILEMMAS[s.dilemmaIndex % DILEMMAS.length]
            : s.activeDilemma,
          dilemmaIndex: shouldTrigger ? s.dilemmaIndex + 1 : s.dilemmaIndex,
        }))

        // Auto-reset harvested plot to empty after animation window (600ms)
        setTimeout(() => get().resetPlot(plotId), 600)
      },

      resolveDilemma: (choiceIndex) => {
        const { activeDilemma, wheat, meters } = get()
        if (!activeDilemma) return

        const choice = activeDilemma.choices[choiceIndex]
        if (!choice) return

        const newWheat = applyWheatCost(wheat, choice.wheatCost)
        const newMeters: MeterValues = {
          devotion: clampMeter(meters.devotion + (choice.meterEffect.devotion ?? 0)),
          morality: clampMeter(meters.morality + (choice.meterEffect.morality ?? 0)),
          faithfulness: clampMeter(
            meters.faithfulness + (choice.meterEffect.faithfulness ?? 0)
          ),
        }

        set({
          wheat: Math.max(0, newWheat),
          meters: newMeters,
          activeDilemma: null,
        })
      },

      resetPlot: (plotId) => {
        set((s) => ({
          plots: s.plots.map((p) =>
            p.id === plotId && p.state === 'harvested'
              ? { ...p, state: 'empty', plantedAt: null }
              : p
          ),
        }))
      },
    }),
    {
      name: 'eve-game-state',
      // Only persist the data fields, not the action functions
      partialize: (state) => ({
        plots: state.plots,
        wheat: state.wheat,
        meters: state.meters,
        harvestsSinceLastDilemma: state.harvestsSinceLastDilemma,
        dilemmaIndex: state.dilemmaIndex,
        activeDilemma: state.activeDilemma,
      }),
    }
  )
)
