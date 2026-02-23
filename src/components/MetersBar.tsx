import { useGameStore } from "@/store/gameStore";
import { HE } from "@/game/strings.he";
import styles from "./MetersBar.module.css";

const METERS = [
  { key: "devotion", label: HE.meters.devotion, colorClass: styles.devotion },
  { key: "morality", label: HE.meters.morality, colorClass: styles.morality },
  {
    key: "faithfulness",
    label: HE.meters.faithfulness,
    colorClass: styles.faithfulness,
  },
] as const;

type Props = { onManageDecisions: () => void };

export const MetersBar = ({ onManageDecisions }: Props) => {
  const meters = useGameStore((s) => s.meters);

  return (
    <div className={styles.container}>
      {METERS.map(({ key, label, colorClass }) => (
        <div key={key} className={styles.meter}>
          <span className={styles.label}>{label}</span>
          <div className={styles.track}>
            <div
              className={`${styles.fill} ${colorClass}`}
              style={{ width: `${meters[key]}%` }}
            />
          </div>
          <span className={styles.value}>{meters[key]}</span>
        </div>
      ))}
      <button
        className={styles.manageBtn}
        onClick={() => onManageDecisions()}
        aria-label={HE.decisionsPanel.manageButtonLabel}
      >
        ⚙
      </button>
    </div>
  );
};
