import { useState } from 'react'
import { BuildingType } from '@/types'
import type { BuildingSlot } from '@/types'
import { useGameStore } from '@/store/game-store'
import { HE } from '@/game/strings.he'
import styles from './BuildingSlotTile.module.css'

type Props = { slot: BuildingSlot }

const BUILDING_TYPES: { type: BuildingType; label: string; emoji: string }[] = [
    { type: BuildingType.Farmhouse, label: HE.buildings.Farmhouse, emoji: '🏠' },
    { type: BuildingType.Barn, label: HE.buildings.Barn, emoji: '🌾' },
    { type: BuildingType.Sheepfold, label: HE.buildings.Sheepfold, emoji: '🐑' },
    { type: BuildingType.Silo, label: HE.buildings.Silo, emoji: '🏗️' },
]

const BUILT_EMOJI: Record<BuildingType, string> = {
    [BuildingType.Farmhouse]: '🏠',
    [BuildingType.Barn]: '🌾',
    [BuildingType.Sheepfold]: '🐑',
    [BuildingType.Silo]: '🏗️',
}

export const BuildingSlotTile = ({ slot }: Props): React.JSX.Element => {
    const buildStructure = useGameStore((s) => s.buildStructure)
    const [picking, setPicking] = useState(false)

    if (slot.state === 'built' && slot.buildingType !== null) {
        return (
            <div className={styles.tile}>
                <span className={styles.emoji}>{BUILT_EMOJI[slot.buildingType]}</span>
                <span className={styles.label}>{HE.buildings[slot.buildingType]}</span>
            </div>
        )
    }

    if (picking) {
        return (
            <div className={styles.tile}>
                <div className={styles.pickingGrid}>
                    {BUILDING_TYPES.map(({ type, label, emoji }) => (
                        <button
                            key={type}
                            className={styles.typeBtn}
                            onClick={() => {
                                buildStructure(slot.id, type)
                                setPicking(false)
                            }}
                        >
                            {emoji} {label}
                        </button>
                    ))}
                </div>
                <button className={styles.backBtn} onClick={() => setPicking(false)}>
                    ← חזור
                </button>
            </div>
        )
    }

    return (
        <div className={styles.tile}>
            <button className={styles.buildBtn} onClick={() => setPicking(true)}>
                {HE.buildings.emptySlotLabel}
            </button>
        </div>
    )
}
