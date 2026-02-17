import { describe, it, expect } from 'vitest'
import {
  getTileType,
  tileOrigin,
  clampCamera,
  initialCamera,
  applyMomentumFrame,
  buildTileGrid,
  FARM_COORD,
  TILE_STRIDE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  MAP_COLS,
  MAP_ROWS,
  MOMENTUM_FRICTION,
  MOMENTUM_STOP_THRESHOLD,
} from './worldMap'

describe('getTileType', () => {
  it('returns farm for FARM_COORD', () => {
    expect(getTileType(FARM_COORD)).toBe('farm')
  })
  it('returns locked for tiles adjacent to farm', () => {
    expect(getTileType({ col: FARM_COORD.col + 1, row: FARM_COORD.row })).toBe('locked')
    expect(getTileType({ col: FARM_COORD.col, row: FARM_COORD.row + 1 })).toBe('locked')
  })
  it('returns locked for corners', () => {
    expect(getTileType({ col: 0, row: 0 })).toBe('locked')
    expect(getTileType({ col: 4, row: 4 })).toBe('locked')
  })
})

describe('buildTileGrid', () => {
  const grid = buildTileGrid()

  it('returns MAP_COLS × MAP_ROWS tiles', () => {
    expect(grid).toHaveLength(MAP_COLS * MAP_ROWS)
  })
  it('has exactly one farm tile', () => {
    expect(grid.filter((t) => t.type === 'farm')).toHaveLength(1)
  })
  it('farm tile is at FARM_COORD', () => {
    const farm = grid.find((t) => t.type === 'farm')!
    expect(farm.coord).toEqual(FARM_COORD)
  })
  it('all other tiles are locked', () => {
    expect(grid.filter((t) => t.type === 'locked')).toHaveLength(MAP_COLS * MAP_ROWS - 1)
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
    expect(clampCamera({ x: 100, y: 0 }, 430, 700).x).toBe(0)
  })
  it('clamps y to 0 when camera tries to go past the top world edge', () => {
    expect(clampCamera({ x: 0, y: 100 }, 430, 700).y).toBe(0)
  })
  it('clamps to minimum when over-panning right', () => {
    const result = clampCamera({ x: -9999, y: 0 }, 430, 700)
    expect(result.x).toBe(430 - WORLD_WIDTH)
  })
  it('clamps to minimum when over-panning down', () => {
    const result = clampCamera({ x: 0, y: -9999 }, 430, 700)
    expect(result.y).toBe(700 - WORLD_HEIGHT)
  })
  it('leaves a valid camera position unchanged', () => {
    const cam = { x: -500, y: -400 }
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
    const result = applyMomentumFrame({ x: -500, y: -500 }, 10, 10, 430, 700)
    expect(result.velX).toBeCloseTo(10 * MOMENTUM_FRICTION)
    expect(result.velY).toBeCloseTo(10 * MOMENTUM_FRICTION)
  })
  it('marks done when both velocity components are below threshold', () => {
    const v = MOMENTUM_STOP_THRESHOLD / 2
    const result = applyMomentumFrame({ x: -500, y: -500 }, v, v, 430, 700)
    expect(result.done).toBe(true)
  })
  it('does not mark done while velocity is above threshold', () => {
    const result = applyMomentumFrame({ x: -500, y: -500 }, 10, 10, 430, 700)
    expect(result.done).toBe(false)
  })
  it('moves camera by current velocity (before decay)', () => {
    const camera = { x: -600, y: -400 }
    const result = applyMomentumFrame(camera, 5, 3, 430, 700)
    // Position uses the pre-decay velocity; only the returned velX/Y is decayed
    expect(result.camera.x).toBeCloseTo(camera.x + 5)
    expect(result.camera.y).toBeCloseTo(camera.y + 3)
  })
  it('clamps the resulting camera position', () => {
    // Start at world edge, push further — result should be clamped
    const result = applyMomentumFrame({ x: 0, y: 0 }, 100, 100, 430, 700)
    expect(result.camera.x).toBe(0)
    expect(result.camera.y).toBe(0)
  })
})
