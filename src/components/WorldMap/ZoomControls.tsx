import { MIN_ZOOM, MAX_ZOOM } from '@/game/worldMap'
import styles from './ZoomControls.module.css'

type Props = {
    zoom: number
    onZoomIn: () => void
    onZoomOut: () => void
}

export const ZoomControls = ({ zoom, onZoomIn, onZoomOut }: Props) => (
    <div className={styles.controls}>
        <button
            className={styles.btn}
            aria-label="Zoom in"
            onClick={onZoomIn}
            disabled={zoom >= MAX_ZOOM}
        >
            +
        </button>
        <button
            className={styles.btn}
            aria-label="Zoom out"
            onClick={onZoomOut}
            disabled={zoom <= MIN_ZOOM}
        >
            −
        </button>
    </div>
)
