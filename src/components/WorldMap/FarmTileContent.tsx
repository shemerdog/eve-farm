import type { TileCoord } from '@/types'
import { FarmGrid } from '@/components/FarmGrid'
import styles from './FarmTileContent.module.css'

type Props = { tileCoord: TileCoord }

export const FarmTileContent = ({ tileCoord }: Props) => (
    <div className={styles.content}>
        <FarmGrid tileCoord={tileCoord} />
    </div>
)
