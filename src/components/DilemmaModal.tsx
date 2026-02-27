import { useState } from 'react'
import { useGameStore } from '@/store/game-store'
import { applyWheatCost } from '@/game/constants'
import { HE } from '@/game/strings.he'
import styles from './DilemmaModal.module.css'

const METER_ABBREV: Record<string, string> = {
    devotion: HE.dilemma.meterAbbrev.devotion,
    morality: HE.dilemma.meterAbbrev.morality,
    faithfulness: HE.dilemma.meterAbbrev.faithfulness,
}

const SAVEABLE_IDS = new Set(['peah', 'shikchah', 'peret_ollelot'])

const formatCost = (cost: number, amount: number, emoji: string): string => {
    const actual = Math.floor(cost)
    if (actual <= 0) return HE.dilemma.free
    return `-${actual} ${emoji} (${amount - applyWheatCost(amount, cost)} ${HE.dilemma.keptByCommunity})`
}

const formatEffect = (effect: Record<string, number>): string => {
    return Object.entries(effect)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${v > 0 ? '↑' : '↓'} ${METER_ABBREV[k] ?? k}`)
        .join('  ')
}

export const DilemmaModal = (): React.JSX.Element | null => {
    const activeDilemma = useGameStore((s) => s.activeDilemma)
    const activeDilemmaContext = useGameStore((s) => s.activeDilemmaContext)
    const wheat = useGameStore((s) => s.wheat)
    const barley = useGameStore((s) => s.barley)
    const grapes = useGameStore((s) => s.grapes)
    const savedFieldDecisions = useGameStore((s) => s.savedFieldDecisions)
    const resolveDilemma = useGameStore((s) => s.resolveDilemma)
    const [saveChecked, setSaveChecked] = useState(false)

    if (!activeDilemma) return null

    const cropAmount =
        activeDilemmaContext === 'grapes'
            ? grapes
            : activeDilemmaContext === 'barley'
              ? barley
              : wheat
    const cropEmoji = activeDilemmaContext === 'grapes' ? '🍇' : '🌾'

    const isSaveable = SAVEABLE_IDS.has(activeDilemma.id)
    const saveKey =
        isSaveable && activeDilemmaContext
            ? `${activeDilemma.id}:${activeDilemmaContext}`
            : activeDilemma.id
    const currentSaved = isSaveable ? savedFieldDecisions[saveKey] : null

    return (
        <div className={styles.backdrop}>
            <div className={styles.modal}>
                <h2 className={styles.title}>{activeDilemma.title}</h2>
                <p className={styles.narrative}>{activeDilemma.narrative}</p>

                {isSaveable && (
                    <label className={styles.saveRow}>
                        <input
                            type="checkbox"
                            className={styles.saveCheckbox}
                            checked={saveChecked}
                            onChange={(e) => setSaveChecked(e.target.checked)}
                        />
                        <span className={styles.saveLabel}>{HE.dilemma.saveForCycles}</span>
                        {currentSaved && (
                            <span className={styles.savedBadge}>
                                {HE.dilemma.savedActive} · {currentSaved.cyclesRemaining}{' '}
                                {HE.dilemma.savedCyclesLeft}
                            </span>
                        )}
                    </label>
                )}

                <div className={styles.choices}>
                    {activeDilemma.choices.map((choice, i) => (
                        <button
                            key={i}
                            className={styles.choice}
                            onClick={() => resolveDilemma(i, saveChecked)}
                        >
                            <span className={styles.choiceLabel}>{choice.label}</span>
                            <span className={styles.choiceMeta}>
                                <span
                                    className={`${styles.costBadge} ${choice.cropCost === 0 ? styles.zeroCost : ''}`}
                                >
                                    {choice.cropCost === 0
                                        ? HE.dilemma.keepAll
                                        : formatCost(choice.cropCost, cropAmount, cropEmoji)}
                                </span>
                                {formatEffect(choice.meterEffect as Record<string, number>)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
