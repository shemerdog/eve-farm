import { useGameStore } from '@/store/gameStore'
import type { Plot, TileCategory, TileCoord, TileSubcategory } from '@/types'

export const resetGameStore = (): void => {
    useGameStore.getState().resetGame()
}

export const buyTileWithWheat = (
    coord: TileCoord,
    category: TileCategory,
    subcategory: TileSubcategory,
    wheat: number = 1000,
): void => {
    useGameStore.setState({ wheat })
    useGameStore.getState().buyTile(coord, category, subcategory)
}

export const findPlotByCoord = (coord: TileCoord): Plot => {
    const plot = useGameStore
        .getState()
        .plots.find((p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row)
    if (!plot) {
        throw new Error(`No plot found at ${coord.col}_${coord.row}`)
    }
    return plot
}

export const patchPlot = (plotId: string, patch: Partial<Plot>): void => {
    const state = useGameStore.getState()
    useGameStore.setState({
        plots: state.plots.map((p) => (p.id === plotId ? { ...p, ...patch } : p)),
    })
}
