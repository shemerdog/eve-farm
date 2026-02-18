import type { CameraState, MapTile, TileCoord, TileType } from '@/types'

// ── Grid constants ───────────────────────────────────────────────────────────

export const MAP_COLS = 5
export const MAP_ROWS = 5
export const TILE_SIZE = 320       // px, width and height of each map tile
export const TILE_GAP = 8          // px, gap between tiles in the CSS grid
export const TILE_STRIDE = TILE_SIZE + TILE_GAP  // 328px

// Full world canvas dimensions (no trailing gap at edges)
export const WORLD_WIDTH = MAP_COLS * TILE_STRIDE - TILE_GAP   // 1632px
export const WORLD_HEIGHT = MAP_ROWS * TILE_STRIDE - TILE_GAP  // 1632px

// ── Momentum constants ───────────────────────────────────────────────────────

export const MOMENTUM_FRICTION = 0.88          // velocity multiplier per frame
export const MOMENTUM_STOP_THRESHOLD = 0.3     // px/frame below which momentum stops

// ── Tile definitions ─────────────────────────────────────────────────────────

// Farm tile is at the center of the 5×5 grid so camera centering works cleanly.
export const FARM_COORD: TileCoord = { col: 2, row: 2 }

export const getTileType = (coord: TileCoord): TileType =>
  coord.col === FARM_COORD.col && coord.row === FARM_COORD.row ? 'farm' : 'locked'

export const buildTileGrid = (): MapTile[] =>
  Array.from({ length: MAP_ROWS }, (_, row) =>
    Array.from({ length: MAP_COLS }, (_, col): MapTile => {
      const coord: TileCoord = { col, row }
      return { coord, type: getTileType(coord) }
    })
  ).flat()

// ── Camera math ──────────────────────────────────────────────────────────────

// Pixel position of a tile's top-left corner on the world canvas.
export const tileOrigin = (coord: TileCoord): { x: number; y: number } => ({
  x: coord.col * TILE_STRIDE,
  y: coord.row * TILE_STRIDE,
})

// Clamp camera so the world canvas never scrolls past its own edges.
// camera.x = 0 means world left edge is at viewport left edge (max right).
// camera.x = vpWidth - WORLD_WIDTH means world right edge is at viewport right edge (max left).
export const clampCamera = (
  camera: CameraState,
  vpWidth: number,
  vpHeight: number,
): CameraState => ({
  x: Math.min(0, Math.max(vpWidth - WORLD_WIDTH, camera.x)),
  y: Math.min(0, Math.max(vpHeight - WORLD_HEIGHT, camera.y)),
})

// Initial camera position: centers the farm tile in the viewport.
export const initialCamera = (vpWidth: number, vpHeight: number): CameraState => {
  const { x: farmX, y: farmY } = tileOrigin(FARM_COORD)
  return clampCamera(
    {
      x: vpWidth / 2 - (farmX + TILE_SIZE / 2),
      y: vpHeight / 2 - (farmY + TILE_SIZE / 2),
    },
    vpWidth,
    vpHeight,
  )
}

// ── Tile purchasing helpers ───────────────────────────────────────────────────

// Structural equality for TileCoord (plain object — reference equality not reliable).
export const coordsEqual = (a: TileCoord, b: TileCoord): boolean =>
  a.col === b.col && a.row === b.row

// Returns true if coord exists in the purchasedCoords list.
export const isPurchased = (
  coord: TileCoord,
  purchasedCoords: TileCoord[],
): boolean => purchasedCoords.some((c) => coordsEqual(c, coord))

// Returns true if coord is orthogonally adjacent to the farm tile or any
// purchased tile. Used to determine if a locked tile shows the buy UI.
export const isAdjacentToUnlocked = (
  coord: TileCoord,
  purchasedCoords: TileCoord[],
): boolean => {
  const orthogonalNeighbors: TileCoord[] = [
    { col: coord.col - 1, row: coord.row },
    { col: coord.col + 1, row: coord.row },
    { col: coord.col,     row: coord.row - 1 },
    { col: coord.col,     row: coord.row + 1 },
  ]
  return orthogonalNeighbors.some(
    (n) => coordsEqual(n, FARM_COORD) || isPurchased(n, purchasedCoords),
  )
}

// Apply one frame of momentum decay. Returns next camera + velocity + done flag.
// Position moves by the current velocity, then velocity decays for the next frame.
export const applyMomentumFrame = (
  camera: CameraState,
  velX: number,
  velY: number,
  vpWidth: number,
  vpHeight: number,
): { camera: CameraState; velX: number; velY: number; done: boolean } => {
  const nextVelX = velX * MOMENTUM_FRICTION
  const nextVelY = velY * MOMENTUM_FRICTION
  const done =
    Math.abs(nextVelX) < MOMENTUM_STOP_THRESHOLD &&
    Math.abs(nextVelY) < MOMENTUM_STOP_THRESHOLD
  return {
    // Move by the current (pre-decay) velocity so travel distance is correct
    camera: clampCamera(
      { x: camera.x + velX, y: camera.y + velY },
      vpWidth,
      vpHeight,
    ),
    velX: nextVelX,
    velY: nextVelY,
    done,
  }
}
