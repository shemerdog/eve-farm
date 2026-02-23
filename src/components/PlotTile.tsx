import { useState, useEffect } from 'react'
import type { Plot } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { growthProgress } from '@/game/gameTick'
import { HE } from '@/game/strings.he'
import styles from './PlotTile.module.css'

type Props = { plot: Plot }

const RING_R = 14
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

const ProgressRing = ({ plot }: { plot: Plot }): React.JSX.Element => {
    const [progress, setProgress] = useState(0)

    useEffect((): void | (() => void) => {
        if (plot.state !== 'growing') return
        const update = (): void => setProgress(growthProgress(plot))
        update()
        const id = setInterval(update, 200)
        return (): void => clearInterval(id)
    }, [plot])

    const dashOffset = RING_CIRCUMFERENCE * (1 - progress)

    return (
        <svg className={styles.progressRing} width={36} height={36} viewBox="0 0 36 36">
            <circle
                cx={18}
                cy={18}
                r={RING_R}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={3}
            />
            <circle
                cx={18}
                cy={18}
                r={RING_R}
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

export const PlotTile = ({ plot }: Props): React.JSX.Element => {
    const plowPlot = useGameStore((s) => s.plowPlot)
    const plantWheat = useGameStore((s) => s.plantWheat)
    const plantOrchard = useGameStore((s) => s.plantOrchard)
    const fertilizePlot = useGameStore((s) => s.fertilizePlot)
    const tendPlot = useGameStore((s) => s.tendPlot)
    const thinShoots = useGameStore((s) => s.thinShoots)
    const harvest = useGameStore((s) => s.harvest)
    const gatherSheafs = useGameStore((s) => s.gatherSheafs)
    const [showFloat, setShowFloat] = useState(false)

    // Trigger float-up animation when plot enters harvested state
    useEffect((): void | (() => void) => {
        if (plot.state === 'harvested') {
            setShowFloat(true)
            const id = setTimeout(() => setShowFloat(false), 600)
            return (): void => clearTimeout(id)
        }
    }, [plot.state])

    const stateClass = plot.state !== 'empty' ? styles[plot.state] : ''
    const isGrapes = plot.cropType === 'grapes'
    const isBarley = plot.cropType === 'barley'
    const isOrchard = isGrapes // extend when more orchard crops are added

    const isTendLocked = plot.state === 'fertilized' && plot.nextActionAt !== null
    const isThinLocked = plot.state === 'tended' && plot.nextActionAt !== null
    const secondsLeft =
        plot.nextActionAt !== null
            ? Math.max(0, Math.ceil((plot.nextActionAt - Date.now()) / 1000))
            : 0

    const isInteractive =
        plot.state === 'empty' ||
        plot.state === 'plowed' ||
        plot.state === 'planted' ||
        (plot.state === 'fertilized' && !isTendLocked) ||
        (plot.state === 'tended' && !isThinLocked) ||
        plot.state === 'ready' ||
        plot.state === 'gathered'

    const emoji =
        plot.state === 'empty'
            ? '🪵'
            : plot.state === 'plowed'
              ? '🟫'
              : plot.state === 'planted'
                ? '🌱'
                : plot.state === 'fertilized'
                  ? '🌿'
                  : plot.state === 'tended'
                    ? '✂️'
                    : plot.state === 'growing'
                      ? isGrapes
                          ? '🌿'
                          : '🌱'
                      : plot.state === 'ready'
                        ? isGrapes
                            ? '🍇'
                            : '🌾'
                        : plot.state === 'harvested'
                          ? '✨'
                          : /* gathered */ isGrapes
                            ? '🍇'
                            : isBarley
                              ? '🌾'
                              : '🎋'

    const handleClick = (): void => {
        if (plot.state === 'empty') {
            if (isOrchard) {
                if (!plot.hasBeenPlanted) plantOrchard(plot.id)
                else fertilizePlot(plot.id)
            } else {
                plowPlot(plot.id)
            }
        } else if (plot.state === 'plowed') {
            plantWheat(plot.id)
        } else if (plot.state === 'planted') {
            fertilizePlot(plot.id)
        } else if (plot.state === 'fertilized') {
            if (plot.nextActionAt === null) tendPlot(plot.id)
        } else if (plot.state === 'tended') {
            if (plot.nextActionAt === null) thinShoots(plot.id)
        } else if (plot.state === 'ready') {
            harvest(plot.id)
        } else if (plot.state === 'gathered') {
            gatherSheafs(plot.id)
        }
    }

    return (
        <div
            className={`${styles.tile} ${stateClass} ${isInteractive ? styles.interactive : ''}`}
            data-state={plot.state}
            onClick={handleClick}
        >
            <span className={styles.emoji}>{emoji}</span>

            {plot.state === 'empty' && !isOrchard && (
                <button className={styles.btn + ' ' + styles.plowBtn} tabIndex={-1}>
                    {HE.plot.plow}
                </button>
            )}

            {plot.state === 'empty' && isOrchard && (
                <button className={styles.btn + ' ' + styles.plantBtn} tabIndex={-1}>
                    {plot.hasBeenPlanted ? HE.plot.fertilize : HE.plot.plantOrchard}
                </button>
            )}

            {plot.state === 'plowed' && (
                <button className={styles.btn + ' ' + styles.plantBtn} tabIndex={-1}>
                    {HE.plot.plant}
                </button>
            )}

            {plot.state === 'planted' && (
                <button className={styles.btn + ' ' + styles.plantBtn} tabIndex={-1}>
                    {HE.plot.fertilize}
                </button>
            )}

            {plot.state === 'fertilized' && (
                <button
                    className={`${styles.btn} ${styles.plantBtn}${isTendLocked ? ' ' + styles.lockedBtn : ''}`}
                    tabIndex={-1}
                    disabled={isTendLocked}
                >
                    {isTendLocked ? `${HE.plot.tendPrune} (${secondsLeft}s)` : HE.plot.tendPrune}
                </button>
            )}

            {plot.state === 'tended' && (
                <button
                    className={`${styles.btn} ${styles.plantBtn}${isThinLocked ? ' ' + styles.lockedBtn : ''}`}
                    tabIndex={-1}
                    disabled={isThinLocked}
                >
                    {isThinLocked ? `${HE.plot.thinShoots} (${secondsLeft}s)` : HE.plot.thinShoots}
                </button>
            )}

            {plot.state === 'ready' && (
                <button className={styles.btn + ' ' + styles.harvestBtn} tabIndex={-1}>
                    {isGrapes ? HE.plot.pickGrapes : HE.plot.harvest}
                </button>
            )}

            {plot.state === 'gathered' && (
                <button className={styles.btn + ' ' + styles.gatherBtn} tabIndex={-1}>
                    {HE.plot.gather}
                </button>
            )}

            {plot.state === 'growing' && <ProgressRing plot={plot} />}

            {showFloat && (
                <span className={styles.floatUp}>
                    {isGrapes ? '+15 🍇' : isBarley ? '+12 🌿' : '+10 🌾'}
                </span>
            )}
        </div>
    )
}
