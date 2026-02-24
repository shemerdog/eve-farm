import { useGameStore } from '@/store/game-store'
import styles from './ResetButton.module.css'

export const ResetButton = (): React.JSX.Element => {
    const resetGame = useGameStore((s) => s.resetGame)

    return (
        <button className={styles.reset} onClick={() => resetGame()} aria-label="Reset game">
            Reset
        </button>
    )
}
