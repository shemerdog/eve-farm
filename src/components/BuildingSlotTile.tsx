import { useState } from 'react'
import type { BuildingSlot, BuildingType } from '@/types'
import { useGameStore } from '@/store/game-store'
import { HE } from '@/game/strings.he'
import styles from './BuildingSlotTile.module.css'

type Props = { slot: BuildingSlot }

const BUILDING_TYPES: { type: BuildingType; label: string; emoji: string }[] = [
    { type: 'farmhouse', label: HE.buildings.farmhouse, emoji: '🏠' },
    { type: 'barn', label: HE.buildings.barn, emoji: '🌾' },
    { type: 'sheepfold', label: HE.buildings.sheepfold, emoji: '🐑' },
    { type: 'silo', label: HE.buildings.silo, emoji: '🏗️' },
]

const BUILT_EMOJI: Record<BuildingType, string> = {
    farmhouse: '🏠',
    barn: '🌾',
    sheepfold: '🐑',
    silo: '🏗️',
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
