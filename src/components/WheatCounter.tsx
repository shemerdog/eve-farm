import { useGameStore } from '@/store/game-store'
import { SELL_BULK_SIZE } from '@/game/constants'
import type { CropType } from '@/types'
import styles from './WheatCounter.module.css'

export const WheatCounter = (): React.JSX.Element => {
    const wheat = useGameStore((s) => s.wheat)
    const grapes = useGameStore((s) => s.grapes)
    const barley = useGameStore((s) => s.barley)
    const shekels = useGameStore((s) => s.shekels)
    const sellCrops = useGameStore((s) => s.sellCrops)

    const sell = (cropType: CropType) => () => sellCrops(cropType)

    return (
        <div className={styles.counter}>
            <div className={styles.shekels}>₪ {shekels.toLocaleString()}</div>
            <div className={styles.crops}>
                <span className={styles.icon}>🌾</span>
                <span>{wheat}</span>
                <button
                    className={styles.sellBtn}
                    disabled={wheat < SELL_BULK_SIZE}
                    onClick={sell('wheat')}
                >
                    מכור
                </button>
                {barley > 0 && (
                    <>
                        <span className={styles.separator}>·</span>
                        <span className={styles.icon}>🌿</span>
                        <span>{barley}</span>
                        <button
                            className={styles.sellBtn}
                            disabled={barley < SELL_BULK_SIZE}
                            onClick={sell('barley')}
                        >
                            מכור
                        </button>
                    </>
                )}
                {grapes > 0 && (
                    <>
                        <span className={styles.separator}>·</span>
                        <span className={styles.icon}>🍇</span>
                        <span>{grapes}</span>
                        <button
                            className={styles.sellBtn}
                            disabled={grapes < SELL_BULK_SIZE}
                            onClick={sell('grapes')}
                        >
                            מכור
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
