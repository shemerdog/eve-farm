import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/game-store'
import { PlotState } from '@/types'

// Starts a 500ms interval that calls tickGrowth() whenever any plot is growing.
// Uses wall-clock timestamps — resilient to tab backgrounding.
export const useGameLoop = (): void => {
    const tickGrowth = useGameStore((s) => s.tickGrowth)
    const plots = useGameStore((s) => s.plots)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const anyGrowing = plots.some((p) => p.state === PlotState.Growing)

    useEffect((): void | (() => void) => {
        if (anyGrowing) {
            intervalRef.current = setInterval(tickGrowth, 500)
        }
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [anyGrowing, tickGrowth])
}
