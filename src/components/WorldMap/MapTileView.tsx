import { useMemo } from 'react'
import type { MapTile, TileCategory } from '@/types'
import { useGameStore } from '@/store/game-store'
import { isAdjacentToUnlocked, isPurchased, coordsEqual } from '@/game/world-map'
import { calcTilePrice } from '@/game/constants'
import { FarmTileContent } from './FarmTileContent'
import { VineyardTileContent } from './VineyardTileContent'
import { BarleyFieldTileContent } from './BarleyFieldTileContent'
import { BuildingTileContent } from './BuildingTileContent'
import { LockedTileContent } from './LockedTileContent'
import styles from './MapTileView.module.css'

type Props = { tile: MapTile }

export const MapTileView = ({ tile }: Props): React.JSX.Element => {
    const purchasedCoords = useGameStore((s) => s.purchasedCoords)
    const tileCategories = useGameStore((s) => s.tileCategories)
    const wheat = useGameStore((s) => s.wheat)
    const buyTile = useGameStore((s) => s.buyTile)
    const allPlots = useGameStore((s) => s.plots)

    const tilePlots = useMemo(
        () => allPlots.filter((p) => coordsEqual(p.tileCoord, tile.coord)),
        [allPlots, tile.coord],
    )

    if (tile.type === 'farm') {
        return (
            <div className={`${styles.tile} ${styles.farm}`}>
                <FarmTileContent tileCoord={tile.coord} />
            </div>
        )
    }

    const purchased = isPurchased(tile.coord, purchasedCoords)

    if (purchased) {
        const key = `${tile.coord.col}_${tile.coord.row}`
        const category: TileCategory = tileCategories[key] ?? 'field'
        const firstCropType = tilePlots[0]?.cropType ?? 'wheat'
        return (
            <div className={`${styles.tile} ${styles.farm}`}>
                {category === 'structure' ? (
                    <BuildingTileContent tileCoord={tile.coord} />
                ) : category === 'orchard' ? (
                    <VineyardTileContent tileCoord={tile.coord} />
                ) : firstCropType === 'barley' ? (
                    <BarleyFieldTileContent tileCoord={tile.coord} />
                ) : (
                    <FarmTileContent tileCoord={tile.coord} />
                )}
            </div>
        )
    }

    const purchasable = isAdjacentToUnlocked(tile.coord, purchasedCoords)
    const price = calcTilePrice(purchasedCoords.length)
    const canAfford = wheat >= price

    return (
        <div className={`${styles.tile} ${styles.locked}`}>
            <LockedTileContent
                purchasable={purchasable}
                canAfford={canAfford}
                price={price}
                onBuy={(category, subcategory) => buyTile(tile.coord, category, subcategory)}
            />
        </div>
    )
}
