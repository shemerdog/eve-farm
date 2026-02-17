import type { MapTile } from '@/types'
import { FarmTileContent } from './FarmTileContent'
import { LockedTileContent } from './LockedTileContent'
import styles from './MapTileView.module.css'

type Props = { tile: MapTile }

export const MapTileView = ({ tile }: Props) => (
  <div className={`${styles.tile} ${styles[tile.type]}`}>
    {tile.type === 'farm'   && <FarmTileContent />}
    {tile.type === 'locked' && <LockedTileContent />}
  </div>
)
