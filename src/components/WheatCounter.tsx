import { useGameStore } from "@/store/gameStore";
import styles from "./WheatCounter.module.css";

export const WheatCounter = () => {
  const wheat = useGameStore((s) => s.wheat);
  const grapes = useGameStore((s) => s.grapes);
  const barley = useGameStore((s) => s.barley);

  return (
    <div className={styles.counter}>
      <span className={styles.icon}>🌾</span>
      <span>{wheat}</span>
      {grapes > 0 && (
        <>
          <span className={styles.separator}>·</span>
          <span className={styles.icon}>🍇</span>
          <span>{grapes}</span>
        </>
      )}
      {barley > 0 && (
        <>
          <span className={styles.separator}>·</span>
          <span className={styles.icon}>🌿</span>
          <span>{barley}</span>
        </>
      )}
    </div>
  );
};
