import type { Dilemma, MeterValues, SavedFieldDecision } from '@/types'
import {
    BARLEY_PER_HARVEST,
    GRAPES_PER_HARVEST,
    WHEAT_PER_HARVEST,
    applyWheatCost,
    clampMeter,
} from '@/game/constants'
import { DILEMMAS, NETA_REVAI_DILEMMA, ORLAH_DILEMMA } from '@/game/dilemmas'
import type { GameActions, GetState, SetState } from './store-types'

const PEAH_DILEMMA = DILEMMAS.find((d) => d.id === 'peah')!
const SHIKCHAH_DILEMMA = DILEMMAS.find((d) => d.id === 'shikchah')!

const SAVEABLE_DILEMMA_IDS = new Set(['peah', 'shikchah'])

/** Apply a dilemma choice to wheat + meters and return the new values. */
function applyDilemmaChoice(
    dilemma: Dilemma,
    choiceIndex: number,
    wheat: number,
    meters: MeterValues,
): { wheat: number; meters: MeterValues } {
    const choice = dilemma.choices[choiceIndex]
    return {
        wheat: Math.max(0, applyWheatCost(wheat, choice.wheatCost)),
        meters: {
            devotion: clampMeter(meters.devotion + (choice.meterEffect.devotion ?? 0)),
            morality: clampMeter(meters.morality + (choice.meterEffect.morality ?? 0)),
            faithfulness: clampMeter(meters.faithfulness + (choice.meterEffect.faithfulness ?? 0)),
        },
    }
}

/** Determine which dilemma (if any) should be shown when a plot is harvested. */
function resolveHarvestDilemma(harvestCount: number, isOrchard: boolean): Dilemma | null {
    if (isOrchard) {
        if (harvestCount < 3) return ORLAH_DILEMMA
        if (harvestCount === 3) return NETA_REVAI_DILEMMA
        return null // harvestCount >= 4: no dilemma
    }
    return PEAH_DILEMMA
}

/** Decrement cyclesRemaining for a saved decision, removing it when it hits 0. */
function decrementSaved(
    saved: Record<string, SavedFieldDecision>,
    key: string,
): Record<string, SavedFieldDecision> {
    const entry = saved[key]
    if (!entry) return saved
    if (entry.cyclesRemaining <= 1) {
        return Object.fromEntries(Object.entries(saved).filter(([k]) => k !== key))
    }
    return {
        ...saved,
        [key]: { ...entry, cyclesRemaining: entry.cyclesRemaining - 1 },
    }
}

export const createDilemmaActions = (
    set: SetState,
    get: GetState,
): Pick<
    GameActions,
    'harvest' | 'gatherSheafs' | 'resolveDilemma' | 'toggleDecisionEnabled' | 'resetPlot'
> => ({
    harvest: (plotId: string): void => {
        const state = get()
        const plot = state.plots.find((p) => p.id === plotId)
        if (!plot || plot.state !== 'ready') return

        const coordKey = `${plot.tileCoord.col}_${plot.tileCoord.row}`
        const isOrchard = state.tileCategories[coordKey] === 'orchard'

        const dilemmaToShow = resolveHarvestDilemma(plot.harvestCount, isOrchard)

        const plotsUpdated = state.plots.map((p) =>
            p.id === plotId
                ? {
                      ...p,
                      state: 'harvested' as const,
                      harvestCount: isOrchard ? p.harvestCount + 1 : p.harvestCount,
                  }
                : p,
        )

        // Auto-resolve PEAH for wheat/barley when a saved decision exists
        const isFieldCropHarvest = plot.cropType === 'wheat' || plot.cropType === 'barley'

        // Track encounter for PEAH dilemma
        const peahKey = `peah:${plot.cropType}`
        const newEncounteredDilemmas =
            isFieldCropHarvest && !state.encounteredDilemmas.includes(peahKey)
                ? [...state.encounteredDilemmas, peahKey]
                : state.encounteredDilemmas

        if (isFieldCropHarvest && state.activeDilemma === null) {
            const saved = state.savedFieldDecisions[peahKey]
            if (saved && saved.cyclesRemaining > 0 && saved.enabled) {
                const { wheat, meters } = applyDilemmaChoice(
                    PEAH_DILEMMA,
                    saved.choiceIndex,
                    state.wheat,
                    state.meters,
                )
                set({
                    plots: plotsUpdated,
                    wheat,
                    meters,
                    savedFieldDecisions: decrementSaved(state.savedFieldDecisions, peahKey),
                    encounteredDilemmas: newEncounteredDilemmas,
                })
                setTimeout(() => get().resetPlot(plotId), 600)
                return
            }
        }

        // Orchard with no dilemma (cycle 5+): just advance to harvested then reset
        if (isOrchard && dilemmaToShow === null) {
            set({
                plots: plotsUpdated,
                encounteredDilemmas: newEncounteredDilemmas,
            })
            setTimeout(() => get().resetPlot(plotId), 600)
            return
        }

        set((s) => ({
            plots: plotsUpdated,
            activeDilemma: state.activeDilemma === null ? dilemmaToShow : s.activeDilemma,
            activeDilemmaContext:
                state.activeDilemma === null ? plot.cropType : s.activeDilemmaContext,
            activePlotId: state.activeDilemma === null ? plotId : s.activePlotId,
            encounteredDilemmas: newEncounteredDilemmas,
        }))

        // Transition harvested → gathered after animation window (600ms)
        setTimeout(() => get().resetPlot(plotId), 600)
    },

    gatherSheafs: (plotId: string): void => {
        const state = get()
        const plot = state.plots.find((p) => p.id === plotId)
        if (!plot || plot.state !== 'gathered') return

        const yieldAmount =
            plot.cropType === 'grapes'
                ? GRAPES_PER_HARVEST
                : plot.cropType === 'barley'
                  ? BARLEY_PER_HARVEST
                  : WHEAT_PER_HARVEST

        const isFieldCrop = plot.cropType === 'wheat' || plot.cropType === 'barley'
        const triggerShikchah = isFieldCrop && state.activeDilemma === null

        // Track encounter for SHIKCHAH dilemma
        const shikchahKey = `shikchah:${plot.cropType}`
        const newEncounteredDilemmas =
            triggerShikchah && !state.encounteredDilemmas.includes(shikchahKey)
                ? [...state.encounteredDilemmas, shikchahKey]
                : state.encounteredDilemmas

        const plotsReset = state.plots.map((p) =>
            p.id === plotId ? { ...p, state: 'empty' as const, plantedAt: null } : p,
        )
        const wheatAfterYield = plot.cropType === 'wheat' ? state.wheat + yieldAmount : state.wheat
        const grapesAfterYield =
            plot.cropType === 'grapes' ? state.grapes + yieldAmount : state.grapes
        const barleyAfterYield =
            plot.cropType === 'barley' ? state.barley + yieldAmount : state.barley

        // Auto-resolve SHIKCHAH when a saved decision exists for field crops
        if (triggerShikchah) {
            const saved = state.savedFieldDecisions[shikchahKey]
            if (saved && saved.cyclesRemaining > 0 && saved.enabled) {
                const { wheat, meters } = applyDilemmaChoice(
                    SHIKCHAH_DILEMMA,
                    saved.choiceIndex,
                    wheatAfterYield,
                    state.meters,
                )
                set({
                    plots: plotsReset,
                    wheat,
                    grapes: grapesAfterYield,
                    barley: barleyAfterYield,
                    meters,
                    savedFieldDecisions: decrementSaved(state.savedFieldDecisions, shikchahKey),
                    encounteredDilemmas: newEncounteredDilemmas,
                })
                return
            }
        }

        set((s) => ({
            plots: plotsReset,
            wheat: plot.cropType === 'wheat' ? s.wheat + yieldAmount : s.wheat,
            grapes: plot.cropType === 'grapes' ? s.grapes + yieldAmount : s.grapes,
            barley: plot.cropType === 'barley' ? s.barley + yieldAmount : s.barley,
            activeDilemma: triggerShikchah ? SHIKCHAH_DILEMMA : s.activeDilemma,
            activeDilemmaContext: triggerShikchah ? plot.cropType : s.activeDilemmaContext,
            encounteredDilemmas: newEncounteredDilemmas,
        }))
    },

    resolveDilemma: (choiceIndex: number, save: boolean = false): void => {
        const {
            activeDilemma,
            activeDilemmaContext,
            activePlotId,
            wheat,
            meters,
            savedFieldDecisions,
            plots,
        } = get()
        if (!activeDilemma) return

        const choice = activeDilemma.choices[choiceIndex]
        if (!choice) return

        const { wheat: newWheat, meters: newMeters } = applyDilemmaChoice(
            activeDilemma,
            choiceIndex,
            wheat,
            meters,
        )

        const isSaveable = SAVEABLE_DILEMMA_IDS.has(activeDilemma.id)
        const saveKey =
            isSaveable && activeDilemmaContext
                ? `${activeDilemma.id}:${activeDilemmaContext}`
                : activeDilemma.id
        const newSavedDecisions =
            save && isSaveable && activeDilemmaContext
                ? {
                      ...savedFieldDecisions,
                      [saveKey]: { choiceIndex, cyclesRemaining: 5, enabled: true },
                  }
                : savedFieldDecisions

        // Choice 0 for ORLAH ("Leave the fruit") and NETA_REVAI ("Save for Jerusalem"):
        // skip gather entirely — reset the triggering plot to empty (fertilize stage next).
        const skipGatherAndReset =
            (activeDilemma.id === 'orlah' && choiceIndex === 0) ||
            (activeDilemma.id === 'neta_revai' && choiceIndex === 0)

        const updatedPlots =
            skipGatherAndReset && activePlotId
                ? plots.map((p) =>
                      p.id === activePlotId
                          ? { ...p, state: 'empty' as const, plantedAt: null }
                          : p,
                  )
                : plots

        set({
            plots: updatedPlots,
            wheat: newWheat,
            meters: newMeters,
            activeDilemma: null,
            activeDilemmaContext: null,
            activePlotId: null,
            savedFieldDecisions: newSavedDecisions,
        })
    },

    toggleDecisionEnabled: (key: string): void => {
        set((s) => {
            const entry = s.savedFieldDecisions[key]
            if (!entry) return s
            return {
                savedFieldDecisions: {
                    ...s.savedFieldDecisions,
                    [key]: { ...entry, enabled: !entry.enabled },
                },
            }
        })
    },

    resetPlot: (plotId: string): void => {
        set((s) => ({
            plots: s.plots.map((p) =>
                p.id === plotId && p.state === 'harvested' ? { ...p, state: 'gathered' } : p,
            ),
        }))
    },
})
