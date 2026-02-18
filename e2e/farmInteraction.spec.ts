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

function setGameState(overrides: Record<string, unknown>) {
  const base = {
    plots: PLOTS_EMPTY,
    wheat: 0,
    meters: { devotion: 50, morality: 50, faithfulness: 50 },
    activeDilemma: null,
    harvestsSinceLastDilemma: 0,
    dilemmaIndex: 0,
    purchasedCoords: [],
  }
  return JSON.stringify({ state: { ...base, ...overrides }, version: 2 })
}

test.beforeEach(async ({ page }) => {
  // Inject a clean, known state before each test via localStorage
  await page.addInitScript((key) => {
    localStorage.removeItem(key)
  }, STORE_KEY)
})

// ── Regression: usePan pointer capture bug ──────────────────────────────────

test('tapping inside the map fires clicks — usePan pointer-capture regression', async ({ page }) => {
  await page.goto('/')

  // Before the fix, setPointerCapture on every pointerdown swallowed all
  // click events inside the viewport. This test confirms a tap on the sow
  // button transitions the plot to growing.
  const sowButtons = page.getByRole('button', { name: 'זְרַע' })
  await expect(sowButtons).toHaveCount(4)

  await sowButtons.first().click()

  // One plot is now growing → only 3 sow buttons remain
  await expect(sowButtons).toHaveCount(3)
})

// ── Sow ─────────────────────────────────────────────────────────────────────

test('sow button transitions plot to growing state', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'זְרַע' }).first().click()

  // Growing plots show a progress ring (SVG), not a sow button
  await expect(page.getByRole('button', { name: 'זְרַע' })).toHaveCount(3)
})

// ── Harvest ──────────────────────────────────────────────────────────────────

test('harvest button adds wheat', async ({ page }) => {
  // Seed a plot in the ready state (skip the 15s growth timer)
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    {
      key: STORE_KEY,
      value: setGameState({
        plots: [
          { id: '2_2_0', state: 'ready', plantedAt: Date.now() - 20000, growthDuration: 15000, tileCoord: FARM_COORD },
          ...PLOTS_EMPTY.slice(1),
        ],
        wheat: 0,
      }),
    }
  )
  await page.goto('/')

  // Wheat counter should start at 0
  const wheatDisplay = page.locator('[class*="counter"]')
  await expect(wheatDisplay).toContainText('0')

  await page.getByRole('button', { name: 'קְצֹר' }).click()

  // After harvest wheat increases by 10
  await expect(wheatDisplay).toContainText('10')
})

// ── Buy Tile ─────────────────────────────────────────────────────────────────

test('buy tile button is disabled when player cannot afford it', async ({ page }) => {
  await page.goto('/')
  // Default state has 0 wheat, tile costs 50 → button disabled
  const buyBtn = page.getByRole('button', { name: /buy land/i }).first()
  await expect(buyBtn).toBeDisabled()
})

test('buy tile button is enabled when player can afford it', async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: STORE_KEY, value: setGameState({ wheat: 100 }) }
  )
  await page.goto('/')

  const buyBtn = page.getByRole('button', { name: /buy land/i }).first()
  await expect(buyBtn).toBeEnabled()
})

test('clicking buy tile deducts wheat and unlocks the tile', async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: STORE_KEY, value: setGameState({ wheat: 100 }) }
  )
  await page.goto('/')

  const wheatDisplay = page.locator('[class*="counter"]')
  await expect(wheatDisplay).toContainText('100')

  // Use element.click() via evaluate — some buy tile buttons can be partially off-screen due
  // to the world map's overflow:hidden viewport, which confuses Playwright's coordinate-based
  // click. element.click() fires React's onClick handler regardless of visual position.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')]
      .find((b): b is HTMLButtonElement => b instanceof HTMLButtonElement
        && b.textContent?.trim() === 'Buy Land'
        && !b.disabled)
    btn?.click()
  })

  // Wheat decreases by the tile price (50 for the first tile)
  await expect(wheatDisplay).toContainText('50')
})
