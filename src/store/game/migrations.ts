import type { CropType, GameState, Plot, TileCoord } from '@/types'

type MutablePersistedState = Record<string, unknown>

type MakePlots = (coord: TileCoord, cropType?: CropType) => Plot[]

type MigrateParams = {
    persisted: unknown
    version: number
    farmCoord: TileCoord
    makePlots: MakePlots
}

const asRecord = (value: unknown): MutablePersistedState =>
    value !== null && typeof value === 'object' ? (value as MutablePersistedState) : {}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const asTileCoords = (value: unknown): TileCoord[] =>
    asArray(value)
        .map((item) => asRecord(item))
        .filter(
            (item): item is TileCoord =>
                typeof item.col === 'number' && typeof item.row === 'number',
        )

const mapPlots = (
    state: MutablePersistedState,
    mapper: (plot: MutablePersistedState, index: number) => MutablePersistedState,
): void => {
    state.plots = asArray(state.plots).map((plot, index) => mapper(asRecord(plot), index))
}

export const migratePersistedGameState = ({
    persisted,
    version,
    farmCoord,
    makePlots,
}: MigrateParams): GameState => {
    const state = asRecord(persisted)

    if (version < 2) {
        // Convert old numeric plot IDs to string format and add tileCoord.
        mapPlots(state, (plot, index) => ({
            ...plot,
            id: `${farmCoord.col}_${farmCoord.row}_${typeof plot.id === 'number' ? plot.id : index}`,
            tileCoord: farmCoord,
        }))

        // Re-create plots for any purchased tiles (they had no plots before).
        const purchased = asTileCoords(state.purchasedCoords)
        const plots = asArray(state.plots)
        for (const coord of purchased) {
            plots.push(...makePlots(coord))
        }
        state.plots = plots
    }

    if (version < 3) {
        // Drop fields removed when Peah was changed to trigger every harvest.
        delete state.harvestsSinceLastDilemma
        delete state.dilemmaIndex
    }

    if (version < 4) {
        // Backfill cropType on existing plots (all were wheat before vineyards).
        mapPlots(state, (plot) => ({
            ...plot,
            cropType: plot.cropType ?? 'wheat',
        }))
        // Initialize tileCategories if absent.
        state.tileCategories = state.tileCategories ?? {}
    }

    if (version < 5) {
        // Backfill barley counter for saves that predate barley.
        state.barley = state.barley ?? 0
    }

    if (version < 6 && state.tileCategories) {
        // Rename old category keys: "farm" -> "field", "vineyard" -> "orchard".
        state.tileCategories = Object.entries(asRecord(state.tileCategories)).reduce(
            (acc, [key, category]) => ({
                ...acc,
                [key]: category === 'vineyard' ? 'orchard' : 'field',
            }),
            {},
        )
    }

    if (version < 7) {
        // Add savedFieldDecisions for saves that predate this feature.
        state.savedFieldDecisions = state.savedFieldDecisions ?? {}
    }

    if (version < 8) {
        // Rename saved decision keys to be crop-qualified.
        const savedFieldDecisions = asRecord(state.savedFieldDecisions)
        if (savedFieldDecisions.peah !== undefined) {
            savedFieldDecisions['peah:wheat'] = savedFieldDecisions.peah
            delete savedFieldDecisions.peah
        }
        if (savedFieldDecisions.shikchah !== undefined) {
            savedFieldDecisions['shikchah:wheat'] = savedFieldDecisions.shikchah
            delete savedFieldDecisions.shikchah
        }
        state.savedFieldDecisions = savedFieldDecisions
        state.activeDilemmaContext = state.activeDilemmaContext ?? null
    }

    if (version < 9) {
        // Backfill hasBeenPlanted on all existing plots.
        mapPlots(state, (plot) => ({
            ...plot,
            hasBeenPlanted: plot.hasBeenPlanted ?? false,
        }))
    }

    if (version < 10) {
        // Backfill nextActionAt on all existing plots.
        mapPlots(state, (plot) => ({
            ...plot,
            nextActionAt: plot.nextActionAt ?? null,
        }))
    }

    if (version < 11) {
        // Backfill harvestCount on all plots and activePlotId on state.
        state.activePlotId = state.activePlotId ?? null
        mapPlots(state, (plot) => ({
            ...plot,
            harvestCount: plot.harvestCount ?? 0,
        }))
    }

    if (version < 12) {
        state.encounteredDilemmas = Array.isArray(state.encounteredDilemmas)
            ? state.encounteredDilemmas
            : []

        const savedFieldDecisions = asRecord(state.savedFieldDecisions)
        for (const key of Object.keys(savedFieldDecisions)) {
            const entry = asRecord(savedFieldDecisions[key])
            if (entry.enabled === undefined) {
                savedFieldDecisions[key] = { ...entry, enabled: true }
            }
        }
        state.savedFieldDecisions = savedFieldDecisions
    }

    if (version < 13) {
        // Backfill stepWaitDuration on all plots (null = no active step wait).
        mapPlots(state, (plot) => ({
            ...plot,
            stepWaitDuration: plot.stepWaitDuration ?? null,
        }))
    }

    if (version < 14) {
        // Backfill buildingSlots for saves that predate the structures feature.
        state.buildingSlots = Array.isArray(state.buildingSlots) ? state.buildingSlots : []
    }

    if (version < 15) {
        // Backfill shekels for saves that predate the monetary system.
        state.shekels = typeof state.shekels === 'number' ? state.shekels : 5_000
    }

    return state as GameState
}
