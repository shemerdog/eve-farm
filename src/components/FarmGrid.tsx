import { useMemo } from 'react'
import type { TileCoord } from '@/types'
import { useGameStore } from '@/store/game-store'
import { coordsEqual } from '@/game/world-map'
import { PlotTile } from './PlotTile'
import styles from './FarmGrid.module.css'

type Props = { tileCoord: TileCoord }

export const FarmGrid = ({ tileCoord }: Props): React.JSX.Element => {
    const allPlots = useGameStore((s) => s.plots)
    const plots = useMemo(
        () => allPlots.filter((p) => coordsEqual(p.tileCoord, tileCoord)),
        [allPlots, tileCoord],
    )

    return (
        <div className={styles.grid}>
            {plots.map((plot) => (
                <PlotTile key={plot.id} plot={plot} />
            ))}
        </div>
    )
}
