import { useState } from 'react'
import { useGameLoop } from '@/hooks/use-game-loop'
import { MetersBar } from '@/components/MetersBar'
import { WorldMap } from '@/components/WorldMap'
import { WheatCounter } from '@/components/WheatCounter'
import { DilemmaModal } from '@/components/DilemmaModal'
import { DecisionsPanel } from '@/components/DecisionsPanel'
import { ResetButton } from '@/components/ResetButton'
import styles from './App.module.css'

const App = (): React.JSX.Element => {
    useGameLoop()
    const [showDecisions, setShowDecisions] = useState(false)

    return (
        <div className={styles.app}>
            <MetersBar onManageDecisions={() => setShowDecisions(true)} />
            <WorldMap />
            <WheatCounter />
            <DilemmaModal />
            <ResetButton />
            {showDecisions && <DecisionsPanel onClose={() => setShowDecisions(false)} />}
        </div>
    )
}

export default App
