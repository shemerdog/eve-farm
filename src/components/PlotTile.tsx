import { useState, useEffect } from 'react'
import type { Plot } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { growthProgress } from '@/game/gameTick'
import { HE } from '@/game/strings.he'
import styles from './PlotTile.module.css'

type Props = { plot: Plot }

const RING_R = 14
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

const ProgressRing = ({ plot }: { plot: Plot }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (plot.state !== 'growing') return
    const update = () => setProgress(growthProgress(plot))
    update()
    const id = setInterval(update, 200)
    return () => clearInterval(id)
  }, [plot])

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress)

  return (
    <svg className={styles.progressRing} width={36} height={36} viewBox="0 0 36 36">
      <circle cx={18} cy={18} r={RING_R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
      <circle
        cx={18} cy={18} r={RING_R}
        fill="none"
        stroke="#d4a017"
        strokeWidth={3}
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
        style={{ transition: 'stroke-dashoffset 0.2s linear' }}
      />
    </svg>
  )
}

export const PlotTile = ({ plot }: Props) => {
  const plantWheat = useGameStore((s) => s.plantWheat)
  const harvest = useGameStore((s) => s.harvest)
  const [showFloat, setShowFloat] = useState(false)

  // Trigger float-up animation when plot enters harvested state
  useEffect(() => {
    if (plot.state === 'harvested') {
      setShowFloat(true)
      const id = setTimeout(() => setShowFloat(false), 600)
      return () => clearTimeout(id)
    }
  }, [plot.state])

  const stateClass = plot.state !== 'empty' ? styles[plot.state] : ''
  const isInteractive = plot.state === 'empty' || plot.state === 'ready'

  const emoji =
    plot.state === 'empty'     ? '🪵' :
    plot.state === 'growing'   ? '🌱' :
    plot.state === 'ready'     ? '🌾' :
    /* harvested */               '✨'

  return (
    <div
      className={`${styles.tile} ${stateClass} ${isInteractive ? styles.interactive : ''}`}
      onClick={() => {
        if (plot.state === 'empty') plantWheat(plot.id)
        else if (plot.state === 'ready') harvest(plot.id)
      }}
    >
      <span className={styles.emoji}>{emoji}</span>

      {plot.state === 'empty' && (
        <button className={styles.btn + ' ' + styles.plantBtn} tabIndex={-1}>
          {HE.plot.plant}
        </button>
      )}

      {plot.state === 'ready' && (
        <button className={styles.btn + ' ' + styles.harvestBtn} tabIndex={-1}>
          {HE.plot.harvest}
        </button>
      )}

      {plot.state === 'growing' && <ProgressRing plot={plot} />}

      {showFloat && <span className={styles.floatUp}>+10 🌾</span>}
    </div>
  )
}
