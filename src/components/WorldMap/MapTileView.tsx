import type { MapTile } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { isAdjacentToUnlocked, isPurchased } from '@/game/worldMap'
import { calcTilePrice } from '@/game/constants'
import { FarmTileContent } from './FarmTileContent'
import { LockedTileContent } from './LockedTileContent'
import styles from './MapTileView.module.css'

type Props = { tile: MapTile }

export const MapTileView = ({ tile }: Props) => {
  const purchasedCoords = useGameStore((s) => s.purchasedCoords)
  const wheat = useGameStore((s) => s.wheat)
  const buyTile = useGameStore((s) => s.buyTile)

  if (tile.type === 'farm') {
    return (
      <div className={`${styles.tile} ${styles.farm}`}>
        <FarmTileContent tileCoord={tile.coord} />
      </div>
    )
  }

  const purchased = isPurchased(tile.coord, purchasedCoords)

  if (purchased) {
    return (
      <div className={`${styles.tile} ${styles.farm}`}>
        <FarmTileContent tileCoord={tile.coord} />
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
        onBuy={() => buyTile(tile.coord)}
      />
    </div>
  )
}
