import type { TileCoord } from '@/types'
import { BuildingGrid } from '@/components/BuildingGrid'
import styles from './FarmTileContent.module.css'

type Props = { tileCoord: TileCoord }

export const BuildingTileContent = ({ tileCoord }: Props): React.JSX.Element => (
    <div className={styles.content}>
        <BuildingGrid tileCoord={tileCoord} />
    </div>
)
