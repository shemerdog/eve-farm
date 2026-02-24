import { useGameStore } from '@/store/game-store'
import { DILEMMAS } from '@/game/dilemmas'
import { HE } from '@/game/strings.he'
import styles from './DecisionsPanel.module.css'

const SAVEABLE_IDS = new Set(['peah', 'shikchah'])

type Props = { onClose: () => void }

export const DecisionsPanel = ({ onClose }: Props): React.JSX.Element => {
    const encounteredDilemmas = useGameStore((s) => s.encounteredDilemmas)
    const savedFieldDecisions = useGameStore((s) => s.savedFieldDecisions)
    const toggleDecisionEnabled = useGameStore((s) => s.toggleDecisionEnabled)

    const saveableKeys = encounteredDilemmas.filter((key) => SAVEABLE_IDS.has(key.split(':')[0]))

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>{HE.decisionsPanel.title}</h2>

                {saveableKeys.length === 0 ? (
                    <p className={styles.empty}>{HE.decisionsPanel.noDecisionsYet}</p>
                ) : (
                    <ul className={styles.list}>
                        {saveableKeys.map((key) => {
                            const [dilemmaId] = key.split(':')
                            const dilemma = DILEMMAS.find((d) => d.id === dilemmaId)
                            const saved = savedFieldDecisions[key]
                            const isActive = saved !== undefined && saved.cyclesRemaining > 0

                            return (
                                <li key={key} className={styles.item}>
                                    <label className={styles.row}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={isActive && saved.enabled}
                                            disabled={!isActive}
                                            onChange={() => toggleDecisionEnabled(key)}
                                        />
                                        <div className={styles.info}>
                                            <span className={styles.dilemmaTitle}>
                                                {dilemma?.title ?? dilemmaId}
                                            </span>
                                            {isActive ? (
                                                <span className={styles.cyclesBadge}>
                                                    {saved.cyclesRemaining}{' '}
                                                    {HE.dilemma.savedCyclesLeft}
                                                </span>
                                            ) : (
                                                <span className={styles.noSaved}>
                                                    {HE.decisionsPanel.noSavedChoice}
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                </li>
                            )
                        })}
                    </ul>
                )}

                <button className={styles.closeBtn} onClick={onClose}>
                    ✕
                </button>
            </div>
        </div>
    )
}
