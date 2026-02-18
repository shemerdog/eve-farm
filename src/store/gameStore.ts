import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, Plot, MeterValues, TileCoord } from '@/types'
import {
  PLOT_COUNT,
  WHEAT_GROWTH_DURATION,
  WHEAT_PER_HARVEST,
  HARVESTS_TO_TRIGGER_DILEMMA,
  METER_INITIAL,
  applyWheatCost,
  clampMeter,
  calcTilePrice,
} from '@/game/constants'
import { tickPlot } from '@/game/gameTick'
import { DILEMMAS } from '@/game/dilemmas'
import { FARM_COORD, isAdjacentToUnlocked, isPurchased } from '@/game/worldMap'

const makePlots = (coord: TileCoord): Plot[] =>
  Array.from({ length: PLOT_COUNT }, (_, i) => ({
    id: `${coord.col}_${coord.row}_${i}`,
    state: 'empty' as const,
    plantedAt: null,
    growthDuration: WHEAT_GROWTH_DURATION,
    tileCoord: coord,
  }))

const initialState: GameState = {
  plots: makePlots(FARM_COORD),
  wheat: 0,
  meters: { ...METER_INITIAL },
  activeDilemma: null,
  harvestsSinceLastDilemma: 0,
  dilemmaIndex: 0,
  purchasedCoords: [],
}

type Actions = {
  plantWheat: (plotId: string) => void
  tickGrowth: () => void
  harvest: (plotId: string) => void
  resolveDilemma: (choiceIndex: number) => void
  resetPlot: (plotId: string) => void
  buyTile: (coord: TileCoord) => void
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

      buyTile: (coord) => {
        set((s) => {
          const price = calcTilePrice(s.purchasedCoords.length)
          if (
            s.wheat < price ||
            !isAdjacentToUnlocked(coord, s.purchasedCoords) ||
            isPurchased(coord, s.purchasedCoords)
          ) return s
          return {
            wheat: Math.max(0, s.wheat - price),
            purchasedCoords: [...s.purchasedCoords, coord],
            plots: [...s.plots, ...makePlots(coord)],
          }
        })
      },
    }),
    {
      name: 'eve-game-state',
      version: 2,
      // Only persist the data fields, not the action functions
      partialize: (state) => ({
        plots: state.plots,
        wheat: state.wheat,
        meters: state.meters,
        harvestsSinceLastDilemma: state.harvestsSinceLastDilemma,
        dilemmaIndex: state.dilemmaIndex,
        activeDilemma: state.activeDilemma,
        purchasedCoords: state.purchasedCoords,
      }),
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any
        if (version < 2) {
          // Convert old numeric plot IDs to string format and add tileCoord
          const farmCoord = FARM_COORD
          state.plots = (state.plots ?? []).map((p: { id: number }, i: number) => ({
            ...p,
            id: `${farmCoord.col}_${farmCoord.row}_${typeof p.id === 'number' ? p.id : i}`,
            tileCoord: farmCoord,
          }))
          // Re-create plots for any purchased tiles (they had no plots before)
          const purchased: TileCoord[] = state.purchasedCoords ?? []
          for (const coord of purchased) {
            state.plots.push(...makePlots(coord))
          }
        }
        return state as GameState
      },
    }
  )
)
