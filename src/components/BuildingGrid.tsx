import { useMemo } from 'react'
import type { TileCoord } from '@/types'
import { useGameStore } from '@/store/game-store'
import { coordsEqual } from '@/game/world-map'
import { BuildingSlotTile } from './BuildingSlotTile'
import styles from './BuildingGrid.module.css'

type Props = { tileCoord: TileCoord }

export const BuildingGrid = ({ tileCoord }: Props): React.JSX.Element => {
    const allSlots = useGameStore((s) => s.buildingSlots)
    const slots = useMemo(
        () => allSlots.filter((sl) => coordsEqual(sl.tileCoord, tileCoord)),
        [allSlots, tileCoord],
    )

    return (
        <div className={styles.grid}>
            {slots.map((slot) => (
                <BuildingSlotTile key={slot.id} slot={slot} />
            ))}
        </div>
    )
}
