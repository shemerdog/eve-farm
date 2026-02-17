import { useGameStore } from '@/store/gameStore'
import { PlotTile } from './PlotTile'
import styles from './FarmGrid.module.css'

export const FarmGrid = () => {
  const plots = useGameStore((s) => s.plots)

  return (
    <div className={styles.grid}>
      {plots.map((plot) => (
        <PlotTile key={plot.id} plot={plot} />
      ))}
    </div>
  )
}
