import { test, expect } from '@playwright/test'

// Zustand's persist middleware stores state under this key
const STORE_KEY = 'eve-game-state'

const FARM_COORD = { col: 2, row: 2 }

const PLOTS_EMPTY = Array.from({ length: 4 }, (_, i) => ({
    id: `${FARM_COORD.col}_${FARM_COORD.row}_${i}`,
    state: 'empty',
    plantedAt: null,
    growthDuration: 15000,
    tileCoord: FARM_COORD,
}))

// Serialize a game state snapshot for localStorage injection.
// Uses version 2 so that migrations v3–v9 run automatically, backfilling
// cropType, hasBeenPlanted, barley, tileCategories, savedFieldDecisions, etc.
function setGameState(overrides: Record<string, unknown>): string {
    const base = {
        plots: PLOTS_EMPTY,
        wheat: 0,
        meters: { devotion: 50, morality: 50, faithfulness: 50 },
        activeDilemma: null,
        harvestsSinceLastDilemma: 0, // removed by v3 migration
        dilemmaIndex: 0, // removed by v3 migration
        purchasedCoords: [],
    }
    return JSON.stringify({ state: { ...base, ...overrides }, version: 2 })
}

test.beforeEach(async ({ page }): Promise<void> => {
    // Inject a clean, known state before each test via localStorage
    await page.addInitScript((key) => {
        localStorage.removeItem(key)
    }, STORE_KEY)
})

// ── Regression: usePan pointer capture bug ──────────────────────────────────

test('tapping inside the map fires clicks — usePan pointer-capture regression', async ({
    page,
}): Promise<void> => {
    await page.goto('/')

    // Before the fix, setPointerCapture on every pointerdown swallowed all
    // click events inside the viewport. Empty wheat plots show the "plow" button
    // (חֲרֹשׁ) first — clicking it is a reliable tap-event regression check.
    const plowButtons = page.getByRole('button', { name: 'חֲרֹשׁ' })
    await expect(plowButtons).toHaveCount(4)

    await plowButtons.first().click()

    // One plot is now plowed → only 3 plow buttons remain
    await expect(plowButtons).toHaveCount(3)
})

// ── Plow + Sow ───────────────────────────────────────────────────────────────

test('plow then sow transitions plot to growing state', async ({ page }): Promise<void> => {
    await page.goto('/')

    // Plow the first empty plot
    await page.getByRole('button', { name: 'חֲרֹשׁ' }).first().click()

    // The plowed plot now shows the sow button (זְרַע); click it
    await page.getByRole('button', { name: 'זְרַע' }).click()

    // Growing plot shows a progress ring — no sow button; 3 plow buttons remain
    await expect(page.getByRole('button', { name: 'זְרַע' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'חֲרֹשׁ' })).toHaveCount(3)
})

// ── Harvest ──────────────────────────────────────────────────────────────────

test('harvest then gather adds wheat', async ({ page }): Promise<void> => {
    // Seed a plot in the ready state (skip the 15s growth timer).
    // Pre-save both PEAH and SHIKCHAH decisions (choice 2 = keep-all, zero cost)
    // so that both dilemmas auto-resolve without showing the modal.
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
        key: STORE_KEY,
        value: setGameState({
            plots: [
                {
                    id: '2_2_0',
                    state: 'ready',
                    plantedAt: Date.now() - 20000,
                    growthDuration: 15000,
                    tileCoord: FARM_COORD,
                },
                ...PLOTS_EMPTY.slice(1),
            ],
            wheat: 0,
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 2, cyclesRemaining: 3 }, // "keep all" — 0 cost
                'shikchah:wheat': { choiceIndex: 2, cyclesRemaining: 3 }, // "take all back" — 0 cost
            },
        }),
    })
    await page.goto('/')

    const wheatDisplay = page.locator('[class*="counter"]')
    await expect(wheatDisplay).toContainText('0')

    // Harvest: PEAH auto-resolves; plot transitions harvested → gathered after 600 ms
    await page.getByRole('button', { name: 'קְצֹר' }).click()

    // Wait for the gather button to appear (600 ms animation window)
    const gatherBtn = page.getByRole('button', { name: 'אֱסֹף' })
    await expect(gatherBtn).toBeVisible()
    await gatherBtn.click()

    // SHIKCHAH auto-resolves (zero cost); wheat += 10
    await expect(wheatDisplay).toContainText('10')
})

// ── Buy Tile ─────────────────────────────────────────────────────────────────

test('buy tile buttons are disabled when player cannot afford', async ({ page }): Promise<void> => {
    await page.goto('/')
    // Default state has 0 wheat, tile costs 50 → category buttons disabled
    const fieldBtn = page.getByRole('button', { name: '🌿 שדה' }).first()
    await expect(fieldBtn).toBeDisabled()
})

test('buy tile buttons are enabled when player can afford', async ({ page }): Promise<void> => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
        key: STORE_KEY,
        value: setGameState({ wheat: 100 }),
    })
    await page.goto('/')

    const fieldBtn = page.getByRole('button', { name: '🌿 שדה' }).first()
    await expect(fieldBtn).toBeEnabled()
})

// ── Manage Decisions panel ───────────────────────────────────────────────────

test('manage decisions panel opens, shows encountered dilemma, and allows toggling', async ({
    page,
}): Promise<void> => {
    // Seed state: peah:wheat has been encountered; saved decision is enabled
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
        key: STORE_KEY,
        value: setGameState({
            encounteredDilemmas: ['peah:wheat'],
            savedFieldDecisions: {
                'peah:wheat': { choiceIndex: 0, cyclesRemaining: 3 },
            },
        }),
    })
    await page.goto('/')

    // Open the panel via the gear button in MetersBar
    await page.getByRole('button', { name: 'נהל החלטות' }).click()

    // Panel should be visible with the modal title
    await expect(page.getByRole('heading', { name: 'נהל החלטות' })).toBeVisible()

    // The PEAH entry should be listed with a checked, enabled checkbox
    const checkbox = page.getByRole('checkbox')
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toBeChecked()
    await expect(checkbox).toBeEnabled()

    // Toggle it off
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()

    // Close via ✕ button
    await page.getByRole('button', { name: /✕/ }).click()
    await expect(page.getByRole('heading', { name: 'נהל החלטות' })).not.toBeVisible()
})

test('clicking buy tile deducts wheat and unlocks the tile', async ({ page }): Promise<void> => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
        key: STORE_KEY,
        value: setGameState({ wheat: 100 }),
    })
    await page.goto('/')

    const wheatDisplay = page.locator('[class*="counter"]')
    await expect(wheatDisplay).toContainText('100')

    // Use element.click() via evaluate — some buy tile buttons can be partially
    // off-screen due to the world map's overflow:hidden viewport, which confuses
    // Playwright's coordinate-based click. element.click() fires the React onClick
    // handler regardless of visual position.

    // Step 1: click the "field" category button (🌿 שדה)
    await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(
            (b): b is HTMLButtonElement =>
                b instanceof HTMLButtonElement && b.textContent?.includes('שדה') && !b.disabled,
        )
        btn?.click()
    })

    // Step 2: wait for the wheat crop sub-button to render, then click it
    await page.waitForFunction(() =>
        [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('חיטה')),
    )
    await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(
            (b): b is HTMLButtonElement =>
                b instanceof HTMLButtonElement && b.textContent?.includes('חיטה'),
        )
        btn?.click()
    })

    // Wheat decreases by the tile price (50 for the first purchased tile)
    await expect(wheatDisplay).toContainText('50')
})
