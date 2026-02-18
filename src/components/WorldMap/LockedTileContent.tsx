import styles from './LockedTileContent.module.css'

type Props = {
  purchasable: boolean
  canAfford: boolean
  price: number
  onBuy: () => void
}

export const LockedTileContent = ({
  purchasable,
  canAfford,
  price,
  onBuy,
}: Props) => {
  const contentClass = purchasable ? styles.purchasable : styles.inaccessible

  return (
    <div className={`${styles.content} ${contentClass}`}>
      {purchasable ? (
        <>
          <div className={`${styles.priceBadge} ${!canAfford ? styles.tooExpensive : ''}`}>
            🌾 {price}
          </div>
          <button
            className={styles.buyButton}
            disabled={!canAfford}
            onClick={onBuy}
          >
            Buy Land
          </button>
        </>
      ) : (
        <span className={styles.lock}>🔒</span>
      )}
    </div>
  )
}
