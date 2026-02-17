import { useGameLoop } from '@/hooks/useGameLoop'
import { MetersBar } from '@/components/MetersBar'
import { WorldMap } from '@/components/WorldMap'
import { WheatCounter } from '@/components/WheatCounter'
import { DilemmaModal } from '@/components/DilemmaModal'
import styles from './App.module.css'

const App = () => {
  useGameLoop()

  return (
    <div className={styles.app}>
      <MetersBar />
      <WorldMap />
      <WheatCounter />
      <DilemmaModal />
    </div>
  )
}

export default App
