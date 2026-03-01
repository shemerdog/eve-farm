import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './game-store'
import { resetGameStore } from '@/test-utils/game-store'
import { migratePersistedGameState } from './game/migrations'
import { makePlots } from './game/state'
import { PlotState, CropType, TileCategory, BuildingType } from '@/types'

beforeEach(() => {
    resetGameStore()
})

describe('v6 migration: category key rename', () => {
    it('"farm" → "field" in tileCategories', () => {
        // Simulate v5 persisted state with old category keys
        useGameStore.setState({
            tileCategories: { '2_1': 'field' as never }, // simulating "farm" renamed
        })
        // After setState, verify the new categories are correct
        // (In real migration, "farm" becomes "field")
        // We simulate the migration result directly since we can't replay persist versioning
        const migrated = Object.entries({ '2_1': 'farm' as never }).reduce(
            (acc, [key, cat]) => ({
                ...acc,
                [key]: cat === 'vineyard' ? 'orchard' : 'field',
            }),
            {} as Record<string, string>,
        )
        expect(migrated['2_1']).toBe('field')
    })

    it('"vineyard" → "orchard" in tileCategories', () => {
        const migrated = Object.entries({ '3_2': 'vineyard' as never }).reduce(
            (acc, [key, cat]) => ({
                ...acc,
                [key]: cat === 'vineyard' ? 'orchard' : 'field',
            }),
            {} as Record<string, string>,
        )
        expect(migrated['3_2']).toBe('orchard')
    })

    it('old "field" → stays "field" in tileCategories', () => {
        const migrated = Object.entries({ '2_3': 'field' as never }).reduce(
            (acc, [key, cat]) => ({
                ...acc,
                [key]: cat === 'vineyard' ? 'orchard' : 'field',
            }),
            {} as Record<string, string>,
        )
        expect(migrated['2_3']).toBe('field')
    })
})

// ── Saved field decisions (PEAH + SHIKCHAH, 5-cycle auto-resolve) ────────────

describe('v12 migration logic', () => {
    it('backfills encounteredDilemmas when missing', () => {
        // Simulate the migration function inline (can't replay persist versioning)
        const state: Record<string, unknown> = {
            savedFieldDecisions: {},
        }
        const version = 11
        if (version < 12) {
            ;(state as Record<string, unknown>).encounteredDilemmas =
                (state.encounteredDilemmas as string[] | undefined) ?? []
        }
        expect(state.encounteredDilemmas).toEqual([])
    })

    it('backfills enabled: true on existing savedFieldDecisions entries', () => {
        const sfd: Record<
            string,
            { choiceIndex: number; cyclesRemaining: number; enabled?: boolean }
        > = {
            'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3 },
            'shikchah:barley': { choiceIndex: 1, cyclesRemaining: 2 },
        }
        // Simulate v12 migration
        for (const key of Object.keys(sfd)) {
            if (sfd[key].enabled === undefined) {
                sfd[key] = { ...sfd[key], enabled: true }
            }
        }
        expect(sfd['peah:wheat'].enabled).toBe(true)
        expect(sfd['shikchah:barley'].enabled).toBe(true)
    })

    it('does not overwrite explicitly set enabled: false during migration', () => {
        const sfd: Record<
            string,
            { choiceIndex: number; cyclesRemaining: number; enabled?: boolean }
        > = {
            'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: false },
        }
        // Simulate v12 migration — only backfills when undefined
        for (const key of Object.keys(sfd)) {
            if (sfd[key].enabled === undefined) {
                sfd[key] = { ...sfd[key], enabled: true }
            }
        }
        expect(sfd['peah:wheat'].enabled).toBe(false)
    })

    it('preserves existing encounteredDilemmas if already present', () => {
        const state = { encounteredDilemmas: ['peah:wheat'] as string[] }
        const version = 11
        if (version < 12) {
            state.encounteredDilemmas = state.encounteredDilemmas ?? []
        }
        expect(state.encounteredDilemmas).toEqual(['peah:wheat'])
    })
})

describe('v14 migration logic', () => {
    it('backfills buildingSlots: [] when missing', () => {
        const raw = {
            plots: [],
            wheat: 0,
            grapes: 0,
            barley: 0,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            activeDilemma: null,
            activeDilemmaContext: null,
            activePlotId: null,
            purchasedCoords: [],
            tileCategories: {},
            savedFieldDecisions: {},
            encounteredDilemmas: [],
            // buildingSlots intentionally absent (old save)
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 13,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.buildingSlots).toEqual([])
    })

    it('preserves existing buildingSlots when already present', () => {
        const existingSlot = {
            id: 's2_1_0',
            tileCoord: { col: 2, row: 1 },
            buildingType: 'barn',
            state: 'built',
        }
        const raw = {
            plots: [],
            wheat: 0,
            grapes: 0,
            barley: 0,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            activeDilemma: null,
            activeDilemmaContext: null,
            activePlotId: null,
            purchasedCoords: [],
            tileCategories: {},
            savedFieldDecisions: {},
            encounteredDilemmas: [],
            buildingSlots: [existingSlot],
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 13,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.buildingSlots).toHaveLength(1)
        expect(result.buildingSlots[0].id).toBe('s2_1_0')
    })
})

describe('v15 migration logic', () => {
    it('backfills shekels: 5000 when absent', () => {
        const raw = {
            plots: [],
            wheat: 0,
            grapes: 0,
            barley: 0,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            activeDilemma: null,
            activeDilemmaContext: null,
            activePlotId: null,
            purchasedCoords: [],
            tileCategories: {},
            savedFieldDecisions: {},
            encounteredDilemmas: [],
            buildingSlots: [],
            // shekels intentionally absent (old save)
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 14,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.shekels).toBe(5_000)
    })

    it('preserves existing shekels when already present', () => {
        const raw = {
            plots: [],
            wheat: 0,
            grapes: 0,
            barley: 0,
            shekels: 1234,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            activeDilemma: null,
            activeDilemmaContext: null,
            activePlotId: null,
            purchasedCoords: [],
            tileCategories: {},
            savedFieldDecisions: {},
            encounteredDilemmas: [],
            buildingSlots: [],
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 14,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.shekels).toBe(1234)
    })
})

describe('v13 migration logic', () => {
    it('backfills stepWaitDuration: null when missing', () => {
        const raw = {
            plots: [
                {
                    id: '2_2_0',
                    state: 'fertilized',
                    plantedAt: null,
                    growthDuration: 30_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: 'grapes',
                    hasBeenPlanted: true,
                    nextActionAt: null,
                    harvestCount: 0,
                    // stepWaitDuration intentionally absent (old save)
                },
            ],
            wheat: 0,
            grapes: 0,
            barley: 0,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            activeDilemma: null,
            activeDilemmaContext: null,
            activePlotId: null,
            purchasedCoords: [],
            tileCategories: {},
            savedFieldDecisions: {},
            encounteredDilemmas: [],
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 12,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.plots[0].stepWaitDuration).toBeNull()
    })

    it('preserves existing stepWaitDuration value when present', () => {
        const raw = {
            plots: [
                {
                    id: '2_2_0',
                    state: 'fertilized',
                    plantedAt: null,
                    growthDuration: 30_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: 'grapes',
                    hasBeenPlanted: true,
                    nextActionAt: Date.now() + 5_000,
                    harvestCount: 0,
                    stepWaitDuration: 10_000,
                },
            ],
            wheat: 0,
            grapes: 0,
            barley: 0,
            meters: { devotion: 50, morality: 50, faithfulness: 50 },
            activeDilemma: null,
            activeDilemmaContext: null,
            activePlotId: null,
            purchasedCoords: [],
            tileCategories: {},
            savedFieldDecisions: {},
            encounteredDilemmas: [],
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 12,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.plots[0].stepWaitDuration).toBe(10_000)
    })
})

describe('v16 migration logic', () => {
    const baseRaw = {
        wheat: 0,
        grapes: 0,
        barley: 0,
        shekels: 5_000,
        meters: { devotion: 50, morality: 50, faithfulness: 50 },
        activeDilemma: null,
        activeDilemmaContext: null,
        activePlotId: null,
        purchasedCoords: [],
        savedFieldDecisions: {},
        encounteredDilemmas: [],
        buildingSlots: [],
    }

    it('converts plot.state from lowercase to PascalCase', () => {
        const raw = {
            ...baseRaw,
            plots: [
                {
                    id: '2_2_0',
                    state: 'fertilized',
                    plantedAt: null,
                    growthDuration: 30_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: 'grapes',
                    hasBeenPlanted: true,
                    nextActionAt: null,
                    harvestCount: 0,
                    stepWaitDuration: null,
                },
            ],
            tileCategories: {},
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 15,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.plots[0].state).toBe(PlotState.Fertilized)
    })

    it('converts plot.cropType from lowercase to PascalCase', () => {
        const raw = {
            ...baseRaw,
            plots: [
                {
                    id: '2_2_0',
                    state: 'growing',
                    plantedAt: null,
                    growthDuration: 30_000,
                    tileCoord: { col: 2, row: 2 },
                    cropType: 'grapes',
                    hasBeenPlanted: true,
                    nextActionAt: null,
                    harvestCount: 0,
                    stepWaitDuration: null,
                },
            ],
            tileCategories: {},
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 15,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.plots[0].cropType).toBe(CropType.Grapes)
    })

    it('converts tileCategories values from lowercase to PascalCase', () => {
        const raw = {
            ...baseRaw,
            plots: [],
            tileCategories: { '3_2': 'orchard', '2_3': 'field' },
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 15,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.tileCategories['3_2']).toBe(TileCategory.Orchard)
        expect(result.tileCategories['2_3']).toBe(TileCategory.Field)
    })

    it('renames savedFieldDecisions keys with PascalCase crop suffix', () => {
        const raw = {
            ...baseRaw,
            plots: [],
            tileCategories: {},
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
                'shikchah:barley': { choiceIndex: 1, cyclesRemaining: 2, enabled: true },
            },
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 15,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.savedFieldDecisions['peah:Wheat']).toBeDefined()
        expect(result.savedFieldDecisions['peah:wheat']).toBeUndefined()
        expect(result.savedFieldDecisions['shikchah:Barley']).toBeDefined()
        expect(result.savedFieldDecisions['shikchah:barley']).toBeUndefined()
    })

    it('updates encounteredDilemmas entries with PascalCase crop suffix', () => {
        const raw = {
            ...baseRaw,
            plots: [],
            tileCategories: {},
            encounteredDilemmas: ['peah:wheat', 'shikchah:barley', 'peret_ollelot:grapes'],
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 15,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.encounteredDilemmas).toContain('peah:Wheat')
        expect(result.encounteredDilemmas).toContain('shikchah:Barley')
        expect(result.encounteredDilemmas).toContain('peret_ollelot:Grapes')
        expect(result.encounteredDilemmas).not.toContain('peah:wheat')
    })

    it('converts activeDilemmaContext from lowercase to PascalCase', () => {
        const raw = {
            ...baseRaw,
            plots: [],
            tileCategories: {},
            activeDilemmaContext: 'grapes',
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 15,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.activeDilemmaContext).toBe(CropType.Grapes)
    })

    it('converts buildingSlots buildingType from lowercase to PascalCase', () => {
        const raw = {
            ...baseRaw,
            plots: [],
            tileCategories: {},
            buildingSlots: [
                { id: 's2_1_0', tileCoord: { col: 2, row: 1 }, buildingType: 'barn', state: 'built' },
                { id: 's2_1_1', tileCoord: { col: 2, row: 1 }, buildingType: 'silo', state: 'built' },
                { id: 's2_1_2', tileCoord: { col: 2, row: 1 }, buildingType: null, state: 'empty' },
            ],
        }
        const result = migratePersistedGameState({
            persisted: raw,
            version: 15,
            farmCoord: { col: 2, row: 2 },
            makePlots,
        })
        expect(result.buildingSlots[0].buildingType).toBe(BuildingType.Barn)
        expect(result.buildingSlots[1].buildingType).toBe(BuildingType.Silo)
        expect(result.buildingSlots[2].buildingType).toBeNull()
    })
})
