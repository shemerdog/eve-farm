# Fix: Button Clicks Do Nothing (Sow / Harvest / Buy Tile)

## Root Cause (confirmed at runtime)

**File:** `src/hooks/usePan.ts`, line 36

```ts
const onPointerDown = (e: PointerEvent) => {
  ...
  el.setPointerCapture(e.pointerId)   // ← BUG IS HERE
}
```

`el` is the viewport `<div>` that wraps the **entire world map**. Calling
`setPointerCapture` on every `pointerdown` redirects all subsequent pointer
events (`pointermove`, `pointerup`) directly to the viewport element — even
when the finger/cursor came down on a button inside the map. The browser then
never delivers `pointerup` or `click` to the inner elements (farm plot tiles,
Buy Land buttons), so their `onClick` handlers never fire.

**Evidence from runtime inspection:**

```
tile[13] pointerdown fired   ← arrives
tile[12] pointerdown fired   ← arrives (bubbles)
(pointerup  — never fires on tile)
(click      — never fires on tile)
```

The `plantWheat`, `harvest`, and `buyTile` store actions are never called.

---

## Fix: Drag-Threshold Before Pointer Capture

Only call `setPointerCapture` (and start real panning) after the pointer has
moved ≥ 5 px from its press origin. Taps (< 5 px movement) are released
naturally, allowing `click` to fire on inner elements.

### Changes to `src/hooks/usePan.ts`

Replace the `dragging` ref pattern with two separate concepts:

- `pointerDown` — a pointer is currently pressed (set on any `pointerdown`)
- `dragActive` — movement exceeded threshold (gate for actual panning + capture)

```ts
const DRAG_THRESHOLD_PX = 5

const pointerDown = useRef(false)
const dragActive  = useRef(false)
const startPos    = useRef({ x: 0, y: 0 })
const lastPos     = useRef({ x: 0, y: 0 })
const vel         = useRef({ x: 0, y: 0 })

const onPointerDown = (e: PointerEvent) => {
  stopMomentum()
  pointerDown.current = true
  dragActive.current  = false
  startPos.current = { x: e.clientX, y: e.clientY }
  lastPos.current  = { x: e.clientX, y: e.clientY }
  vel.current = { x: 0, y: 0 }
}

const onPointerMove = (e: PointerEvent) => {
  if (!pointerDown.current) return

  if (!dragActive.current) {
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (dx * dx + dy * dy < DRAG_THRESHOLD_PX ** 2) return
    // Threshold exceeded — commit to drag
    dragActive.current = true
    el.setPointerCapture(e.pointerId)   // only now, so taps stay unaffected
    lastPos.current = { x: e.clientX, y: e.clientY }
    return
  }

  const dx = e.clientX - lastPos.current.x
  const dy = e.clientY - lastPos.current.y
  lastPos.current = { x: e.clientX, y: e.clientY }
  vel.current = { x: dx, y: dy }
  const camera = useWorldStore.getState().camera
  setCamera(clampCamera({ x: camera.x + dx, y: camera.y + dy }, el.clientWidth, el.clientHeight))
}

const onPointerUp = () => {
  pointerDown.current = false
  const wasDragging = dragActive.current
  dragActive.current = false
  if (!wasDragging) return          // was a tap — let click propagate normally
  // momentum unchanged from original
  const vpW = el.clientWidth
  const vpH = el.clientHeight
  const step = () => { ... }
  rafId = requestAnimationFrame(step)
}

const onPointerCancel = () => {
  pointerDown.current = false
  dragActive.current  = false
  stopMomentum()
}
```

**No other files need changing.** The store actions, component click handlers,
and the `LockedTileContent` buy button are all wired correctly.

---

## Tools to Install for Manual + Automated Testing

### Already Available

- **Playwright** (MCP plugin) — used during this investigation to open the browser,
  click buttons, and inspect the accessibility tree and console.
  Install for the project repo with:
    ```
    npm install --save-dev @playwright/test
    npx playwright install chromium
    ```

### Recommended Additions

| Tool                        | Purpose                                                | Install                                                       |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `@playwright/test`          | E2E browser automation (click, assert DOM state)       | `npm i -D @playwright/test`                                   |
| `@testing-library/react`    | Component interaction tests in jsdom                   | `npm i -D @testing-library/react @testing-library/user-event` |
| `@testing-library/jest-dom` | Extra assertions (`toBeDisabled`, `toHaveTextContent`) | `npm i -D @testing-library/jest-dom`                          |

The project already uses **Vitest** — all three testing-library packages work
with Vitest out of the box.

---

## Plan: Automated Tests That Would Have Caught This

### 1. Component Test — `PlotTile` click triggers store action (Vitest + RTL)

**File:** `src/components/PlotTile.test.tsx`

```ts
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlotTile } from './PlotTile'

// Mock the store
vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector) => selector({
    plantWheat: vi.fn(),
    harvest: vi.fn(),
  }),
}))

test('clicking sow button calls plantWheat', async () => {
  const plantWheat = vi.fn()
  // wire mock to expose plantWheat...
  render(<PlotTile plot={{ id: 0, state: 'empty' }} />)
  await userEvent.click(screen.getByRole('button', { name: /זְרַע/ }))
  expect(plantWheat).toHaveBeenCalledWith(0)
})
```

### 2. Component Test — `LockedTileContent` buy button calls `onBuy`

**File:** `src/components/WorldMap/LockedTileContent.test.tsx`

```ts
test('buy button calls onBuy when affordable', async () => {
  const onBuy = vi.fn()
  render(<LockedTileContent purchased={false} purchasable canAfford price={50} onBuy={onBuy} />)
  await userEvent.click(screen.getByRole('button', { name: /buy land/i }))
  expect(onBuy).toHaveBeenCalledTimes(1)
})

test('buy button is disabled when cannot afford', () => {
  render(<LockedTileContent purchased={false} purchasable canAfford={false} price={50} onBuy={() => {}} />)
  expect(screen.getByRole('button', { name: /buy land/i })).toBeDisabled()
})
```

### 3. E2E Test — Full click flow in real browser (Playwright)

**File:** `e2e/farmInteraction.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('sow button plants wheat and shows growing state', async ({ page }) => {
    await page.goto('/')
    // Reset to known state
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const firstSowBtn = page.getByRole('button', { name: 'זְרַע' }).first()
    await firstSowBtn.click()

    // Plot should now show growing (progress ring, no sow button)
    await expect(page.getByRole('button', { name: 'זְרַע' })).toHaveCount(3)
})

test('harvest button adds wheat', async ({ page }) => {
    await page.goto('/')
    // Force a plot into 'ready' state via store injection
    await page.evaluate(() => {
        const store = (window as any).__gameStore?.getState()
        store?.set?.((s) => {
            s.plots[0].state = 'ready'
        })
    })
    const before = await page.locator('[class*="wheatCount"]').innerText()
    await page.getByRole('button', { name: 'קְצֹר' }).first().click()
    const after = await page.locator('[class*="wheatCount"]').innerText()
    expect(Number(after)).toBeGreaterThan(Number(before))
})

test('buy tile button works after earning enough wheat', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem('eve-game-state') || '{}')
        s.state = { ...s.state, wheat: 100 }
        localStorage.setItem('eve-game-state', JSON.stringify(s))
    })
    await page.reload()

    const buyBtn = page.getByRole('button', { name: /buy land/i }).first()
    await expect(buyBtn).toBeEnabled()
    await buyBtn.click()
    // At least one tile should now show the unlocked state
    await expect(page.locator('[class*="purchased"]')).toHaveCount(1)
})
```

### 4. `usePan` regression test — pointer capture should not block inner clicks

**File:** `src/hooks/usePan.test.ts` (or inside an E2E test)

```ts
test('tapping inside map still fires click on inner elements', async ({ page }) => {
    await page.goto('/')
    // Check that clicking the sow button works (would fail with the old capture-on-down bug)
    const sowBtn = page.getByRole('button', { name: 'זְרַע' }).first()
    await sowBtn.click()
    await expect(sowBtn).not.toBeVisible() // plot transitioned away from empty
})
```

---

## Summary

| Issue                            | Root cause                                                | Fix file              | Fix size          |
| -------------------------------- | --------------------------------------------------------- | --------------------- | ----------------- |
| Sow / Harvest click does nothing | `setPointerCapture` on every `pointerdown` in `usePan.ts` | `src/hooks/usePan.ts` | ~15 lines changed |
| Buy Tile click does nothing      | Same root cause (button is also inside the viewport)      | same                  | (included above)  |
| No automated regression coverage | No component or E2E tests for click interactions          | new test files        | 3 new test files  |
