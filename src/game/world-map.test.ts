import { describe, it, expect } from 'vitest'
import {
    getTileType,
    tileOrigin,
    clampCamera,
    initialCamera,
    applyMomentumFrame,
    buildTileGrid,
    coordsEqual,
    isPurchased,
    isAdjacentToUnlocked,
    zoomAtPoint,
    FARM_COORD,
    TILE_STRIDE,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    MAP_COLS,
    MAP_ROWS,
    MOMENTUM_FRICTION,
    MOMENTUM_STOP_THRESHOLD,
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_STEP,
} from './world-map'
import { calcTilePrice } from './constants'
import { TileType } from '@/types'

describe('getTileType', () => {
    it('returns farm for FARM_COORD', () => {
        expect(getTileType(FARM_COORD)).toBe(TileType.Wheat)
    })
    it('returns locked for tiles adjacent to farm', () => {
        expect(getTileType({ col: FARM_COORD.col + 1, row: FARM_COORD.row })).toBe(TileType.Locked)
        expect(getTileType({ col: FARM_COORD.col, row: FARM_COORD.row + 1 })).toBe(TileType.Locked)
    })
    it('returns locked for corners', () => {
        expect(getTileType({ col: 0, row: 0 })).toBe(TileType.Locked)
        expect(getTileType({ col: 4, row: 4 })).toBe(TileType.Locked)
    })
})

describe('buildTileGrid', () => {
    const grid = buildTileGrid()

    it('returns MAP_COLS × MAP_ROWS tiles', () => {
        expect(grid).toHaveLength(MAP_COLS * MAP_ROWS)
    })
    it('has exactly one farm tile', () => {
        expect(grid.filter((t) => t.type === TileType.Wheat)).toHaveLength(1)
    })
    it('farm tile is at FARM_COORD', () => {
        const farm = grid.find((t) => t.type === TileType.Wheat)!
        expect(farm.coord).toEqual(FARM_COORD)
    })
    it('all other tiles are locked', () => {
        expect(grid.filter((t) => t.type === TileType.Locked)).toHaveLength(MAP_COLS * MAP_ROWS - 1)
    })
})

describe('tileOrigin', () => {
    it('returns (0, 0) for tile (0, 0)', () => {
        expect(tileOrigin({ col: 0, row: 0 })).toEqual({ x: 0, y: 0 })
    })
    it('uses TILE_STRIDE for col offset', () => {
        expect(tileOrigin({ col: 1, row: 0 })).toEqual({ x: TILE_STRIDE, y: 0 })
    })
    it('uses TILE_STRIDE for row offset', () => {
        expect(tileOrigin({ col: 0, row: 1 })).toEqual({ x: 0, y: TILE_STRIDE })
    })
    it('computes both axes correctly', () => {
        expect(tileOrigin({ col: 2, row: 3 })).toEqual({
            x: 2 * TILE_STRIDE,
            y: 3 * TILE_STRIDE,
        })
    })
})

describe('clampCamera', () => {
    it('clamps x to 0 when camera tries to go past the left world edge', () => {
        expect(clampCamera({ x: 100, y: 0, zoom: 1 }, 430, 700).x).toBe(0)
    })
    it('clamps y to 0 when camera tries to go past the top world edge', () => {
        expect(clampCamera({ x: 0, y: 100, zoom: 1 }, 430, 700).y).toBe(0)
    })
    it('clamps to minimum when over-panning right', () => {
        const result = clampCamera({ x: -9999, y: 0, zoom: 1 }, 430, 700)
        expect(result.x).toBe(430 - WORLD_WIDTH)
    })
    it('clamps to minimum when over-panning down', () => {
        const result = clampCamera({ x: 0, y: -9999, zoom: 1 }, 430, 700)
        expect(result.y).toBe(700 - WORLD_HEIGHT)
    })
    it('leaves a valid camera position unchanged', () => {
        const cam = { x: -500, y: -400, zoom: 1 }
        expect(clampCamera(cam, 430, 700)).toEqual(cam)
    })
})

describe('initialCamera', () => {
    it('returns a clamped camera (never positive)', () => {
        const cam = initialCamera(430, 700)
        expect(cam.x).toBeLessThanOrEqual(0)
        expect(cam.y).toBeLessThanOrEqual(0)
    })
    it('stays within world bounds', () => {
        const cam = initialCamera(430, 700)
        expect(cam.x).toBeGreaterThanOrEqual(430 - WORLD_WIDTH)
        expect(cam.y).toBeGreaterThanOrEqual(700 - WORLD_HEIGHT)
    })
})

describe('applyMomentumFrame', () => {
    it('decays velocity by MOMENTUM_FRICTION each frame', () => {
        const result = applyMomentumFrame({ x: -500, y: -500, zoom: 1 }, 10, 10, 430, 700)
        expect(result.velX).toBeCloseTo(10 * MOMENTUM_FRICTION)
        expect(result.velY).toBeCloseTo(10 * MOMENTUM_FRICTION)
    })
    it('marks done when both velocity components are below threshold', () => {
        const v = MOMENTUM_STOP_THRESHOLD / 2
        const result = applyMomentumFrame({ x: -500, y: -500, zoom: 1 }, v, v, 430, 700)
        expect(result.done).toBe(true)
    })
    it('does not mark done while velocity is above threshold', () => {
        const result = applyMomentumFrame({ x: -500, y: -500, zoom: 1 }, 10, 10, 430, 700)
        expect(result.done).toBe(false)
    })
    it('moves camera by current velocity (before decay)', () => {
        const camera = { x: -600, y: -400, zoom: 1 }
        const result = applyMomentumFrame(camera, 5, 3, 430, 700)
        // Position uses the pre-decay velocity; only the returned velX/Y is decayed
        expect(result.camera.x).toBeCloseTo(camera.x + 5)
        expect(result.camera.y).toBeCloseTo(camera.y + 3)
    })
    it('clamps the resulting camera position', () => {
        // Start at world edge, push further — result should be clamped
        const result = applyMomentumFrame({ x: 0, y: 0, zoom: 1 }, 100, 100, 430, 700)
        expect(result.camera.x).toBe(0)
        expect(result.camera.y).toBe(0)
    })
})

describe('calcTilePrice', () => {
    it('returns 50 for the first tile (n=0)', () => {
        expect(calcTilePrice(0)).toBe(50)
    })
    it('returns 80 for the second tile (n=1)', () => {
        expect(calcTilePrice(1)).toBe(80)
    })
    it('floors fractional results — fourth tile is 204 not 204.8 (n=3)', () => {
        expect(calcTilePrice(3)).toBe(204)
    })
    it('returns 327 for n=4', () => {
        expect(calcTilePrice(4)).toBe(327)
    })
})

describe('coordsEqual', () => {
    it('returns true for identical coords', () => {
        expect(coordsEqual({ col: 2, row: 3 }, { col: 2, row: 3 })).toBe(true)
    })
    it('returns false when col differs', () => {
        expect(coordsEqual({ col: 1, row: 3 }, { col: 2, row: 3 })).toBe(false)
    })
    it('returns false when row differs', () => {
        expect(coordsEqual({ col: 2, row: 2 }, { col: 2, row: 3 })).toBe(false)
    })
})

describe('isPurchased', () => {
    it('returns false for empty purchasedCoords', () => {
        expect(isPurchased({ col: 1, row: 2 }, [])).toBe(false)
    })
    it('returns true when coord is in the list', () => {
        expect(isPurchased({ col: 1, row: 2 }, [{ col: 1, row: 2 }])).toBe(true)
    })
    it('returns false when coord is not in the list', () => {
        expect(isPurchased({ col: 0, row: 2 }, [{ col: 1, row: 2 }])).toBe(false)
    })
})

describe('isAdjacentToUnlocked', () => {
    // FARM_COORD is { col: 2, row: 2 }

    it('returns true for tile orthogonally adjacent to the farm tile (right)', () => {
        expect(isAdjacentToUnlocked({ col: 3, row: 2 }, [])).toBe(true)
    })
    it('returns true for tile orthogonally adjacent to the farm tile (above)', () => {
        expect(isAdjacentToUnlocked({ col: 2, row: 1 }, [])).toBe(true)
    })
    it('returns false for tile diagonal to farm only', () => {
        expect(isAdjacentToUnlocked({ col: 3, row: 3 }, [])).toBe(false)
    })
    it('returns false for a corner tile with no purchased neighbors', () => {
        expect(isAdjacentToUnlocked({ col: 0, row: 0 }, [])).toBe(false)
    })
    it('returns true when orthogonally adjacent to a purchased tile', () => {
        // { col: 3, row: 2 } is purchased (adjacent to farm), so { col: 4, row: 2 } becomes purchasable
        expect(isAdjacentToUnlocked({ col: 4, row: 2 }, [{ col: 3, row: 2 }])).toBe(true)
    })
    it('returns false when only diagonally adjacent to a purchased tile', () => {
        expect(isAdjacentToUnlocked({ col: 4, row: 3 }, [{ col: 3, row: 2 }])).toBe(false)
    })
    it('returns false for the farm tile itself (no unlocked neighbor at distance 1)', () => {
        // FARM_COORD's neighbors are all locked tiles, not FARM_COORD itself
        expect(isAdjacentToUnlocked(FARM_COORD, [])).toBe(false)
    })
})

// ── Zoom ─────────────────────────────────────────────────────────────────────

describe('zoom constants', () => {
    it('MIN_ZOOM is 0.4', () => {
        expect(MIN_ZOOM).toBe(0.4)
    })
    it('MAX_ZOOM is 1.5', () => {
        expect(MAX_ZOOM).toBe(1.5)
    })
    it('ZOOM_STEP is 0.15', () => {
        expect(ZOOM_STEP).toBe(0.15)
    })
})

describe('clampCamera — zoom field', () => {
    it('preserves zoom when in valid range', () => {
        expect(clampCamera({ x: -500, y: -400, zoom: 1.0 }, 430, 700).zoom).toBe(1.0)
    })
    it('clamps zoom below MIN_ZOOM up to MIN_ZOOM', () => {
        expect(clampCamera({ x: 0, y: 0, zoom: 0.1 }, 430, 700).zoom).toBe(MIN_ZOOM)
    })
    it('clamps zoom above MAX_ZOOM down to MAX_ZOOM', () => {
        expect(clampCamera({ x: 0, y: 0, zoom: 3.0 }, 430, 700).zoom).toBe(MAX_ZOOM)
    })
    it('centers x when zoomed-out world fits within viewport width', () => {
        // At zoom 0.4: scaledW = 1632 * 0.4 = 652.8 < vpW 1000 → center
        const result = clampCamera({ x: 0, y: 0, zoom: 0.4 }, 1000, 1000)
        const scaledW = WORLD_WIDTH * 0.4
        expect(result.x).toBeCloseTo((1000 - scaledW) / 2)
    })
    it('centers y when zoomed-out world fits within viewport height', () => {
        const result = clampCamera({ x: 0, y: 0, zoom: 0.4 }, 1000, 1000)
        const scaledH = WORLD_HEIGHT * 0.4
        expect(result.y).toBeCloseTo((1000 - scaledH) / 2)
    })
})

describe('zoomAtPoint', () => {
    it('keeps the world point under the pivot fixed after zoom change', () => {
        const camera = { x: -200, y: -100, zoom: 1.0 }
        const pivotX = 215 // arbitrary screen position
        const pivotY = 350
        const newZoom = 1.5
        const result = zoomAtPoint(camera, newZoom, pivotX, pivotY, 430, 700)
        // World point that was under the pivot before:
        const wx = (pivotX - camera.x) / camera.zoom
        const wy = (pivotY - camera.y) / camera.zoom
        // After zoom that same world point should map to the same screen position
        expect(wx * result.zoom + result.x).toBeCloseTo(pivotX)
        expect(wy * result.zoom + result.y).toBeCloseTo(pivotY)
    })
    it('clamps result zoom to MIN_ZOOM when requested zoom is too small', () => {
        const camera = { x: 0, y: 0, zoom: 1.0 }
        expect(zoomAtPoint(camera, 0.1, 215, 350, 430, 700).zoom).toBe(MIN_ZOOM)
    })
    it('clamps result zoom to MAX_ZOOM when requested zoom is too large', () => {
        const camera = { x: 0, y: 0, zoom: 1.0 }
        expect(zoomAtPoint(camera, 5.0, 215, 350, 430, 700).zoom).toBe(MAX_ZOOM)
    })
})

describe('initialCamera — zoom field', () => {
    it('returns zoom: 1', () => {
        expect(initialCamera(430, 700).zoom).toBe(1)
    })
})

describe('applyMomentumFrame — zoom passthrough', () => {
    it('passes zoom through to result camera unchanged', () => {
        const result = applyMomentumFrame({ x: -500, y: -500, zoom: 0.8 }, 10, 10, 430, 700)
        expect(result.camera.zoom).toBe(0.8)
    })
})
