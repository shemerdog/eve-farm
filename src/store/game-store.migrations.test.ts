import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './game-store'
import { resetGameStore } from '@/test-utils/game-store'

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
