import { useState, useEffect } from 'react'
import { PlotState, CropType } from '@/types'
import type { Plot } from '@/types'
import { useGameStore } from '@/store/game-store'
import { growthProgress, stepWaitProgress } from '@/game/game-tick'
import { HE } from '@/game/strings.he'
import styles from './PlotTile.module.css'

type Props = { plot: Plot }

const RING_R = 14
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

const ProgressRing = ({ plot }: { plot: Plot }): React.JSX.Element => {
    const [progress, setProgress] = useState(0)

    const isStepWait =
        (plot.state === PlotState.Fertilized || plot.state === PlotState.Tended) &&
        plot.nextActionAt !== null

    useEffect((): void | (() => void) => {
        if (plot.state !== PlotState.Growing && !isStepWait) return
        const update = (): void =>
            setProgress(isStepWait ? stepWaitProgress(plot) : growthProgress(plot))
        update()
        const id = setInterval(update, 200)
        return (): void => clearInterval(id)
    }, [plot, isStepWait])

    const dashOffset = RING_CIRCUMFERENCE * (1 - progress)
    const strokeColor = isStepWait ? '#7cb9a0' : '#d4a017'

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
                stroke={strokeColor}
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
        if (plot.state === PlotState.Harvested) {
            setShowFloat(true)
            const id = setTimeout(() => setShowFloat(false), 600)
            return (): void => clearTimeout(id)
        }
    }, [plot.state])

    const stateClass = plot.state !== PlotState.Empty ? styles[plot.state] : ''
    const isGrapes = plot.cropType === CropType.Grapes
    const isBarley = plot.cropType === CropType.Barley
    const isOrchard = isGrapes // extend when more orchard crops are added

    const isTendLocked = plot.state === PlotState.Fertilized && plot.nextActionAt !== null
    const isThinLocked = plot.state === PlotState.Tended && plot.nextActionAt !== null
    const secondsLeft =
        plot.nextActionAt !== null
            ? Math.max(0, Math.ceil((plot.nextActionAt - Date.now()) / 1000))
            : 0

    const isInteractive =
        plot.state === PlotState.Empty ||
        plot.state === PlotState.Plowed ||
        plot.state === PlotState.Planted ||
        (plot.state === PlotState.Fertilized && !isTendLocked) ||
        (plot.state === PlotState.Tended && !isThinLocked) ||
        plot.state === PlotState.Ready ||
        plot.state === PlotState.Gathered

    const emoji =
        plot.state === PlotState.Empty
            ? '🪵'
            : plot.state === PlotState.Plowed
              ? '🟫'
              : plot.state === PlotState.Planted
                ? '🌱'
                : plot.state === PlotState.Fertilized
                  ? '🌿'
                  : plot.state === PlotState.Tended
                    ? '✂️'
                    : plot.state === PlotState.Growing
                      ? isGrapes
                          ? '🌿'
                          : '🌱'
                      : plot.state === PlotState.Ready
                        ? isGrapes
                            ? '🍇'
                            : '🌾'
                        : plot.state === PlotState.Harvested
                          ? '✨'
                          : /* gathered */ isGrapes
                            ? '🍇'
                            : isBarley
                              ? '🌾'
                              : '🎋'

    const handleClick = (): void => {
        if (plot.state === PlotState.Empty) {
            if (isOrchard) {
                if (!plot.hasBeenPlanted) plantOrchard(plot.id)
                else fertilizePlot(plot.id)
            } else {
                plowPlot(plot.id)
            }
        } else if (plot.state === PlotState.Plowed) {
            plantWheat(plot.id)
        } else if (plot.state === PlotState.Planted) {
            fertilizePlot(plot.id)
        } else if (plot.state === PlotState.Fertilized) {
            if (plot.nextActionAt === null) tendPlot(plot.id)
        } else if (plot.state === PlotState.Tended) {
            if (plot.nextActionAt === null) thinShoots(plot.id)
        } else if (plot.state === PlotState.Ready) {
            harvest(plot.id)
        } else if (plot.state === PlotState.Gathered) {
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

            {plot.state === PlotState.Empty && !isOrchard && (
                <button className={styles.btn + ' ' + styles.plowBtn} tabIndex={-1}>
                    {HE.plot.plow}
                </button>
            )}

            {plot.state === PlotState.Empty && isOrchard && (
                <button className={styles.btn + ' ' + styles.plantBtn} tabIndex={-1}>
                    {plot.hasBeenPlanted ? HE.plot.fertilize : HE.plot.plantOrchard}
                </button>
            )}

            {plot.state === PlotState.Plowed && (
                <button className={styles.btn + ' ' + styles.plantBtn} tabIndex={-1}>
                    {HE.plot.plant}
                </button>
            )}

            {plot.state === PlotState.Planted && (
                <button className={styles.btn + ' ' + styles.plantBtn} tabIndex={-1}>
                    {HE.plot.fertilize}
                </button>
            )}

            {plot.state === PlotState.Fertilized && (
                <button
                    className={`${styles.btn} ${styles.plantBtn}${isTendLocked ? ' ' + styles.lockedBtn : ''}`}
                    tabIndex={-1}
                    disabled={isTendLocked}
                >
                    {isTendLocked ? `${HE.plot.tendPrune} (${secondsLeft}s)` : HE.plot.tendPrune}
                </button>
            )}

            {plot.state === PlotState.Tended && (
                <button
                    className={`${styles.btn} ${styles.plantBtn}${isThinLocked ? ' ' + styles.lockedBtn : ''}`}
                    tabIndex={-1}
                    disabled={isThinLocked}
                >
                    {isThinLocked ? `${HE.plot.thinShoots} (${secondsLeft}s)` : HE.plot.thinShoots}
                </button>
            )}

            {plot.state === PlotState.Ready && (
                <button className={styles.btn + ' ' + styles.harvestBtn} tabIndex={-1}>
                    {isGrapes ? HE.plot.pickGrapes : HE.plot.harvest}
                </button>
            )}

            {plot.state === PlotState.Gathered && (
                <button className={styles.btn + ' ' + styles.gatherBtn} tabIndex={-1}>
                    {HE.plot.gather}
                </button>
            )}

            {(plot.state === PlotState.Growing ||
                ((plot.state === PlotState.Fertilized || plot.state === PlotState.Tended) &&
                    plot.nextActionAt !== null)) && <ProgressRing plot={plot} />}

            {showFloat && (
                <span className={styles.floatUp}>
                    {isGrapes ? '+15 🍇' : isBarley ? '+12 🌿' : '+10 🌾'}
                </span>
            )}
        </div>
    )
}
