import { useLayoutEffect, useRef } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { usePan } from '@/hooks/usePan'
import {
  buildTileGrid,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TILE_SIZE,
  TILE_GAP,
  MAP_COLS,
  MAP_ROWS,
  initialCamera,
} from '@/game/worldMap'
import { MapTileView } from './MapTileView'
import styles from './WorldMap.module.css'

// Built once at module level — tile grid never changes at runtime
const TILES = buildTileGrid()

export const WorldMap = () => {
  const camera = useWorldStore((s) => s.camera)
  const setCamera = useWorldStore((s) => s.setCamera)
  const viewportRef = useRef<HTMLDivElement>(null)

  usePan(viewportRef)

  // Centre the farm tile in the viewport on every mount.
  // Camera is not persisted so this always starts from a clean origin.
  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    setCamera(initialCamera(vp.clientWidth, vp.clientHeight))
  }, [setCamera])

  return (
    <div ref={viewportRef} className={styles.viewport}>
      <div
        className={styles.world}
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          gridTemplateColumns: `repeat(${MAP_COLS}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${MAP_ROWS}, ${TILE_SIZE}px)`,
          gap: TILE_GAP,
          transform: `translate(${camera.x}px, ${camera.y}px)`,
        }}
      >
        {TILES.map((tile) => (
          <MapTileView
            key={`${tile.coord.col}-${tile.coord.row}`}
            tile={tile}
          />
        ))}
      </div>
    </div>
  )
}
