import { useGameStore } from '@/store/gameStore'
import styles from './WheatCounter.module.css'

export const WheatCounter = () => {
  const wheat = useGameStore((s) => s.wheat)

  return (
    <div className={styles.counter}>
      <span className={styles.icon}>🌾</span>
      <span>{wheat}</span>
    </div>
  )
}
