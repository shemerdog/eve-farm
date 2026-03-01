import type { TileCoord } from '@/types'
import { FarmGrid } from '@/components/FarmGrid'
import styles from './WheatTileContent.module.css'

type Props = { tileCoord: TileCoord }

export const WheatTileContent = ({ tileCoord }: Props): React.JSX.Element => (
    <div className={styles.content}>
        <FarmGrid tileCoord={tileCoord} />
    </div>
)
