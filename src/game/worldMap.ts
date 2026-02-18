import type { CameraState, MapTile, TileCoord, TileType } from "@/types";

// ── Grid constants ───────────────────────────────────────────────────────────

export const MAP_COLS = 5;
export const MAP_ROWS = 5;
export const TILE_SIZE = 320; // px, width and height of each map tile
export const TILE_GAP = 8; // px, gap between tiles in the CSS grid
export const TILE_STRIDE = TILE_SIZE + TILE_GAP; // 328px

// Full world canvas dimensions (no trailing gap at edges)
export const WORLD_WIDTH = MAP_COLS * TILE_STRIDE - TILE_GAP; // 1632px
export const WORLD_HEIGHT = MAP_ROWS * TILE_STRIDE - TILE_GAP; // 1632px

// ── Momentum constants ───────────────────────────────────────────────────────

export const MOMENTUM_FRICTION = 0.88; // velocity multiplier per frame
export const MOMENTUM_STOP_THRESHOLD = 0.3; // px/frame below which momentum stops

// ── Zoom constants ────────────────────────────────────────────────────────────

export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 1.5;
export const ZOOM_STEP = 0.15;

// ── Tile definitions ─────────────────────────────────────────────────────────

// Farm tile is at the center of the 5×5 grid so camera centering works cleanly.
export const FARM_COORD: TileCoord = { col: 2, row: 2 };

export const getTileType = (coord: TileCoord): TileType =>
  coord.col === FARM_COORD.col && coord.row === FARM_COORD.row
    ? "farm"
    : "locked";

export const buildTileGrid = (): MapTile[] =>
  Array.from({ length: MAP_ROWS }, (_, row) =>
    Array.from({ length: MAP_COLS }, (_, col): MapTile => {
      const coord: TileCoord = { col, row };
      return { coord, type: getTileType(coord) };
    }),
  ).flat();

// ── Camera math ──────────────────────────────────────────────────────────────

// Pixel position of a tile's top-left corner on the world canvas.
export const tileOrigin = (coord: TileCoord): { x: number; y: number } => ({
  x: coord.col * TILE_STRIDE,
  y: coord.row * TILE_STRIDE,
});

// Clamp camera so the world canvas never scrolls past its own edges.
// When the scaled world fits inside the viewport on an axis, center it instead.
export const clampCamera = (
  camera: CameraState,
  vpWidth: number,
  vpHeight: number,
): CameraState => {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom));
  const scaledW = WORLD_WIDTH * z;
  const scaledH = WORLD_HEIGHT * z;
  return {
    x:
      scaledW <= vpWidth
        ? (vpWidth - scaledW) / 2
        : Math.min(0, Math.max(vpWidth - scaledW, camera.x)),
    y:
      scaledH <= vpHeight
        ? (vpHeight - scaledH) / 2
        : Math.min(0, Math.max(vpHeight - scaledH, camera.y)),
    zoom: z,
  };
};

// Initial camera position: centers the farm tile in the viewport at zoom 1.
export const initialCamera = (
  vpWidth: number,
  vpHeight: number,
): CameraState => {
  const { x: farmX, y: farmY } = tileOrigin(FARM_COORD);
  return clampCamera(
    {
      x: vpWidth / 2 - (farmX + TILE_SIZE / 2),
      y: vpHeight / 2 - (farmY + TILE_SIZE / 2),
      zoom: 1,
    },
    vpWidth,
    vpHeight,
  );
};

// Zoom anchored to a screen-space pivot point. Adjusts x/y so the world point
// under (pivotX, pivotY) remains at the same screen position after the zoom change.
export const zoomAtPoint = (
  camera: CameraState,
  newZoom: number,
  pivotX: number,
  pivotY: number,
  vpWidth: number,
  vpHeight: number,
): CameraState => {
  const wx = (pivotX - camera.x) / camera.zoom;
  const wy = (pivotY - camera.y) / camera.zoom;
  return clampCamera(
    { x: pivotX - wx * newZoom, y: pivotY - wy * newZoom, zoom: newZoom },
    vpWidth,
    vpHeight,
  );
};

// ── Tile purchasing helpers ───────────────────────────────────────────────────

// Structural equality for TileCoord (plain object — reference equality not reliable).
export const coordsEqual = (a: TileCoord, b: TileCoord): boolean =>
  a.col === b.col && a.row === b.row;

// Returns true if coord exists in the purchasedCoords list.
export const isPurchased = (
  coord: TileCoord,
  purchasedCoords: TileCoord[],
): boolean => purchasedCoords.some((c) => coordsEqual(c, coord));

// Returns true if coord is orthogonally adjacent to the farm tile or any
// purchased tile. Used to determine if a locked tile shows the buy UI.
export const isAdjacentToUnlocked = (
  coord: TileCoord,
  purchasedCoords: TileCoord[],
): boolean => {
  const orthogonalNeighbors: TileCoord[] = [
    { col: coord.col - 1, row: coord.row },
    { col: coord.col + 1, row: coord.row },
    { col: coord.col, row: coord.row - 1 },
    { col: coord.col, row: coord.row + 1 },
  ];
  return orthogonalNeighbors.some(
    (n) => coordsEqual(n, FARM_COORD) || isPurchased(n, purchasedCoords),
  );
};

// Apply one frame of momentum decay. Returns next camera + velocity + done flag.
// Position moves by the current velocity, then velocity decays for the next frame.
export const applyMomentumFrame = (
  camera: CameraState,
  velX: number,
  velY: number,
  vpWidth: number,
  vpHeight: number,
): { camera: CameraState; velX: number; velY: number; done: boolean } => {
  const nextVelX = velX * MOMENTUM_FRICTION;
  const nextVelY = velY * MOMENTUM_FRICTION;
  const done =
    Math.abs(nextVelX) < MOMENTUM_STOP_THRESHOLD &&
    Math.abs(nextVelY) < MOMENTUM_STOP_THRESHOLD;
  return {
    // Move by the current (pre-decay) velocity so travel distance is correct
    camera: clampCamera(
      { x: camera.x + velX, y: camera.y + velY, zoom: camera.zoom },
      vpWidth,
      vpHeight,
    ),
    velX: nextVelX,
    velY: nextVelY,
    done,
  };
};
