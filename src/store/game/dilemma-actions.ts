import { CropType, PlotState, TileCategory } from '@/types'
import type { Dilemma, MeterValues, SavedFieldDecision } from '@/types'
import {
    BARLEY_PER_HARVEST,
    GRAPES_PER_HARVEST,
    WHEAT_PER_HARVEST,
    applyWheatCost,
    clampMeter,
} from '@/game/constants'
import { DILEMMAS, NETA_REVAI_DILEMMA, ORLAH_DILEMMA, PERET_OLLELOT_DILEMMA } from '@/game/dilemmas'
import type { GameActions, GetState, SetState } from './store-types'

const PEAH_DILEMMA = DILEMMAS.find((d) => d.id === 'peah')!
const SHIKCHAH_DILEMMA = DILEMMAS.find((d) => d.id === 'shikchah')!

const SAVEABLE_DILEMMA_IDS = new Set(['peah', 'shikchah', 'peret_ollelot'])

/** Apply a dilemma choice to a crop amount + meters and return the new values. */
function applyDilemmaChoice(
    dilemma: Dilemma,
    choiceIndex: number,
    cropAmount: number,
    meters: MeterValues,
): { newCropAmount: number; meters: MeterValues } {
    const choice = dilemma.choices[choiceIndex]
    return {
        newCropAmount: Math.max(0, applyWheatCost(cropAmount, choice.cropCost)),
        meters: {
            devotion: clampMeter(meters.devotion + (choice.meterEffect.devotion ?? 0)),
            morality: clampMeter(meters.morality + (choice.meterEffect.morality ?? 0)),
            faithfulness: clampMeter(meters.faithfulness + (choice.meterEffect.faithfulness ?? 0)),
        },
    }
}

/** Determine which dilemma should be shown when a plot is harvested. */
function resolveHarvestDilemma(harvestCount: number, isOrchard: boolean): Dilemma | null {
    if (isOrchard) {
        if (harvestCount < 3) return ORLAH_DILEMMA
        if (harvestCount === 3) return NETA_REVAI_DILEMMA
        return PERET_OLLELOT_DILEMMA // harvestCount >= 4: cycle 5+
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
        if (!plot || plot.state !== PlotState.Ready) return

        const coordKey = `${plot.tileCoord.col}_${plot.tileCoord.row}`
        const isOrchard = state.tileCategories[coordKey] === TileCategory.Orchard

        const dilemmaToShow = resolveHarvestDilemma(plot.harvestCount, isOrchard)

        const plotsUpdated = state.plots.map((p) =>
            p.id === plotId
                ? {
                      ...p,
                      state: PlotState.Harvested,
                      harvestCount: isOrchard ? p.harvestCount + 1 : p.harvestCount,
                  }
                : p,
        )

        const isFieldCropHarvest = plot.cropType === CropType.Wheat || plot.cropType === CropType.Barley

        // Track encounter for PEAH (field crops) and PERET_OLLELOT (orchard cycle 5+)
        const peahKey = `peah:${plot.cropType}`
        const peretOllelotKey = 'peret_ollelot:grapes'
        let newEncounteredDilemmas = state.encounteredDilemmas
        if (isFieldCropHarvest && !newEncounteredDilemmas.includes(peahKey)) {
            newEncounteredDilemmas = [...newEncounteredDilemmas, peahKey]
        }
        if (
            isOrchard &&
            plot.harvestCount >= 4 &&
            !newEncounteredDilemmas.includes(peretOllelotKey)
        ) {
            newEncounteredDilemmas = [...newEncounteredDilemmas, peretOllelotKey]
        }

        // Auto-resolve PEAH for wheat/barley when a saved decision exists
        if (isFieldCropHarvest && state.activeDilemma === null) {
            const saved = state.savedFieldDecisions[peahKey]
            if (saved && saved.cyclesRemaining > 0 && saved.enabled) {
                const cropAmount = plot.cropType === CropType.Barley ? state.barley : state.wheat
                const { newCropAmount, meters } = applyDilemmaChoice(
                    PEAH_DILEMMA,
                    saved.choiceIndex,
                    cropAmount,
                    state.meters,
                )
                const cropUpdate =
                    plot.cropType === CropType.Barley
                        ? { wheat: state.wheat, barley: newCropAmount }
                        : { wheat: newCropAmount, barley: state.barley }
                set({
                    plots: plotsUpdated,
                    ...cropUpdate,
                    meters,
                    savedFieldDecisions: decrementSaved(state.savedFieldDecisions, peahKey),
                    encounteredDilemmas: newEncounteredDilemmas,
                })
                setTimeout(() => get().resetPlot(plotId), 600)
                return
            }
        }

        // Auto-resolve Peret/Ollelot for orchard (cycle 5+) when a saved decision exists
        if (isOrchard && dilemmaToShow?.id === 'peret_ollelot' && state.activeDilemma === null) {
            const saved = state.savedFieldDecisions[peretOllelotKey]
            if (saved && saved.cyclesRemaining > 0 && saved.enabled) {
                const { newCropAmount, meters } = applyDilemmaChoice(
                    PERET_OLLELOT_DILEMMA,
                    saved.choiceIndex,
                    state.grapes,
                    state.meters,
                )
                set({
                    plots: plotsUpdated,
                    grapes: newCropAmount,
                    meters,
                    savedFieldDecisions: decrementSaved(state.savedFieldDecisions, peretOllelotKey),
                    encounteredDilemmas: newEncounteredDilemmas,
                })
                setTimeout(() => get().resetPlot(plotId), 600)
                return
            }
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
        if (!plot || plot.state !== PlotState.Gathered) return

        const yieldAmount =
            plot.cropType === CropType.Grapes
                ? GRAPES_PER_HARVEST
                : plot.cropType === CropType.Barley
                  ? BARLEY_PER_HARVEST
                  : WHEAT_PER_HARVEST

        const isFieldCrop = plot.cropType === CropType.Wheat || plot.cropType === CropType.Barley
        const triggerShikchah = isFieldCrop && state.activeDilemma === null

        // Track encounter for SHIKCHAH dilemma
        const shikchahKey = `shikchah:${plot.cropType}`
        const newEncounteredDilemmas =
            triggerShikchah && !state.encounteredDilemmas.includes(shikchahKey)
                ? [...state.encounteredDilemmas, shikchahKey]
                : state.encounteredDilemmas

        const plotsReset = state.plots.map((p) =>
            p.id === plotId ? { ...p, state: PlotState.Empty, plantedAt: null } : p,
        )
        const wheatAfterYield = plot.cropType === CropType.Wheat ? state.wheat + yieldAmount : state.wheat
        const grapesAfterYield =
            plot.cropType === CropType.Grapes ? state.grapes + yieldAmount : state.grapes
        const barleyAfterYield =
            plot.cropType === CropType.Barley ? state.barley + yieldAmount : state.barley

        // Auto-resolve SHIKCHAH when a saved decision exists for field crops
        if (triggerShikchah) {
            const saved = state.savedFieldDecisions[shikchahKey]
            if (saved && saved.cyclesRemaining > 0 && saved.enabled) {
                const cropAmountAfterYield =
                    plot.cropType === CropType.Barley ? barleyAfterYield : wheatAfterYield
                const { newCropAmount, meters } = applyDilemmaChoice(
                    SHIKCHAH_DILEMMA,
                    saved.choiceIndex,
                    cropAmountAfterYield,
                    state.meters,
                )
                const cropUpdate =
                    plot.cropType === CropType.Barley
                        ? { wheat: wheatAfterYield, barley: newCropAmount }
                        : { wheat: newCropAmount, barley: barleyAfterYield }
                set({
                    plots: plotsReset,
                    ...cropUpdate,
                    grapes: grapesAfterYield,
                    meters,
                    savedFieldDecisions: decrementSaved(state.savedFieldDecisions, shikchahKey),
                    encounteredDilemmas: newEncounteredDilemmas,
                })
                return
            }
        }

        set((s) => ({
            plots: plotsReset,
            wheat: plot.cropType === CropType.Wheat ? s.wheat + yieldAmount : s.wheat,
            grapes: plot.cropType === CropType.Grapes ? s.grapes + yieldAmount : s.grapes,
            barley: plot.cropType === CropType.Barley ? s.barley + yieldAmount : s.barley,
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
            barley,
            grapes,
            meters,
            savedFieldDecisions,
            plots,
        } = get()
        if (!activeDilemma) return

        const choice = activeDilemma.choices[choiceIndex]
        if (!choice) return

        const cropAmount =
            activeDilemmaContext === CropType.Grapes
                ? grapes
                : activeDilemmaContext === CropType.Barley
                  ? barley
                  : wheat

        const { newCropAmount, meters: newMeters } = applyDilemmaChoice(
            activeDilemma,
            choiceIndex,
            cropAmount,
            meters,
        )

        const cropUpdate =
            activeDilemmaContext === CropType.Grapes
                ? { wheat, barley, grapes: newCropAmount }
                : activeDilemmaContext === CropType.Barley
                  ? { wheat, barley: newCropAmount, grapes }
                  : { wheat: newCropAmount, barley, grapes }

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
                          ? { ...p, state: PlotState.Empty, plantedAt: null }
                          : p,
                  )
                : plots

        set({
            plots: updatedPlots,
            ...cropUpdate,
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
                p.id === plotId && p.state === PlotState.Harvested
                    ? { ...p, state: PlotState.Gathered }
                    : p,
            ),
        }))
    },
})
