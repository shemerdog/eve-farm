import type { TileCoord } from '@/types'
import { FarmGrid } from '@/components/FarmGrid'
import styles from './VineyardTileContent.module.css'

type Props = { tileCoord: TileCoord }

export const VineyardTileContent = ({ tileCoord }: Props) => (
  <div className={styles.content}>
    <FarmGrid tileCoord={tileCoord} />
  </div>
)
