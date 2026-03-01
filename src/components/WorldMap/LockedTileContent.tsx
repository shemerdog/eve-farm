import { useState } from 'react'
import { TileCategory, TileSubcategory } from '@/types'
import styles from './LockedTileContent.module.css'

type Step = 'root' | 'field' | 'orchard'

type Props = {
    purchasable: boolean
    canAfford: boolean
    price: number
    onBuy: (category: TileCategory, subcategory: TileSubcategory) => void
}

export const LockedTileContent = ({
    purchasable,
    canAfford,
    price,
    onBuy,
}: Props): React.JSX.Element => {
    const [step, setStep] = useState<Step>('root')
    const contentClass = purchasable ? styles.purchasable : styles.inaccessible

    const handleBuy = (category: TileCategory, subcategory: TileSubcategory): void => {
        onBuy(category, subcategory)
        setStep('root')
    }

    return (
        <div className={`${styles.content} ${contentClass}`}>
            {purchasable ? (
                <>
                    <div
                        className={`${styles.priceBadge} ${!canAfford ? styles.tooExpensive : ''}`}
                    >
                        🌾 {price}
                    </div>

                    {step === 'root' && (
                        <div className={styles.buttonRow}>
                            <button
                                className={styles.buyButton}
                                disabled={!canAfford}
                                onClick={() => setStep('field')}
                            >
                                🌿 שדה
                            </button>
                            <button
                                className={styles.buyButton}
                                disabled={!canAfford}
                                onClick={() => setStep('orchard')}
                            >
                                🍇 כרם
                            </button>
                            <button
                                className={styles.buyButton}
                                disabled={!canAfford}
                                onClick={() =>
                                    handleBuy(TileCategory.Structure, TileSubcategory.Structure)
                                }
                            >
                                🏗️ מבנים
                            </button>
                        </div>
                    )}

                    {step === 'field' && (
                        <div className={styles.buttonRow}>
                            <button
                                className={styles.buyButton}
                                onClick={() => handleBuy(TileCategory.Field, TileSubcategory.Wheat)}
                            >
                                🌾 חיטה
                            </button>
                            <button
                                className={styles.buyButton}
                                onClick={() =>
                                    handleBuy(TileCategory.Field, TileSubcategory.Barley)
                                }
                            >
                                🌿 שעורה
                            </button>
                            <button className={styles.backButton} onClick={() => setStep('root')}>
                                ← חזור
                            </button>
                        </div>
                    )}

                    {step === 'orchard' && (
                        <div className={styles.buttonRow}>
                            <button
                                className={styles.buyButton}
                                onClick={() =>
                                    handleBuy(TileCategory.Orchard, TileSubcategory.Grapes)
                                }
                            >
                                🍇 כרם
                            </button>
                            <button className={styles.backButton} onClick={() => setStep('root')}>
                                ← חזור
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <span className={styles.lock}>🔒</span>
            )}
        </div>
    )
}
