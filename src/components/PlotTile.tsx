import { useState, useEffect } from "react";
import type { Plot } from "@/types";
import { useGameStore } from "@/store/gameStore";
import { growthProgress } from "@/game/gameTick";
import { HE } from "@/game/strings.he";
import styles from "./PlotTile.module.css";

type Props = { plot: Plot };

const RING_R = 14;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

const ProgressRing = ({ plot }: { plot: Plot }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (plot.state !== "growing") return;
    const update = () => setProgress(growthProgress(plot));
    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [plot]);

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <svg
      className={styles.progressRing}
      width={36}
      height={36}
      viewBox="0 0 36 36"
    >
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
        stroke="#d4a017"
        strokeWidth={3}
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
        style={{ transition: "stroke-dashoffset 0.2s linear" }}
      />
    </svg>
  );
};

export const PlotTile = ({ plot }: Props) => {
  const plowPlot = useGameStore((s) => s.plowPlot);
  const plantWheat = useGameStore((s) => s.plantWheat);
  const harvest = useGameStore((s) => s.harvest);
  const gatherSheafs = useGameStore((s) => s.gatherSheafs);
  const [showFloat, setShowFloat] = useState(false);

  // Trigger float-up animation when plot enters harvested state
  useEffect(() => {
    if (plot.state === "harvested") {
      setShowFloat(true);
      const id = setTimeout(() => setShowFloat(false), 600);
      return () => clearTimeout(id);
    }
  }, [plot.state]);

  const stateClass = plot.state !== "empty" ? styles[plot.state] : "";
  const isInteractive =
    plot.state === "empty" ||
    plot.state === "plowed" ||
    plot.state === "ready" ||
    plot.state === "gathered";

  const isGrapes = plot.cropType === "grapes";
  const isBarley = plot.cropType === "barley";

  const emoji =
    plot.state === "empty"
      ? "🪵"
      : plot.state === "plowed"
        ? "🟫"
        : plot.state === "growing"
          ? isGrapes
            ? "🌿"
            : "🌱"
          : plot.state === "ready"
            ? isGrapes
              ? "🍇"
              : "🌾"
            : plot.state === "harvested"
              ? "✨"
              : /* gathered */ isGrapes
                ? "🍇"
                : isBarley
                  ? "🌾"
                  : "🎋";

  return (
    <div
      className={`${styles.tile} ${stateClass} ${isInteractive ? styles.interactive : ""}`}
      data-state={plot.state}
      onClick={() => {
        if (plot.state === "empty") plowPlot(plot.id);
        else if (plot.state === "plowed") plantWheat(plot.id);
        else if (plot.state === "ready") harvest(plot.id);
        else if (plot.state === "gathered") gatherSheafs(plot.id);
      }}
    >
      <span className={styles.emoji}>{emoji}</span>

      {plot.state === "empty" && (
        <button className={styles.btn + " " + styles.plowBtn} tabIndex={-1}>
          {HE.plot.plow}
        </button>
      )}

      {plot.state === "plowed" && (
        <button className={styles.btn + " " + styles.plantBtn} tabIndex={-1}>
          {HE.plot.plant}
        </button>
      )}

      {plot.state === "ready" && (
        <button className={styles.btn + " " + styles.harvestBtn} tabIndex={-1}>
          {HE.plot.harvest}
        </button>
      )}

      {plot.state === "gathered" && (
        <button className={styles.btn + " " + styles.gatherBtn} tabIndex={-1}>
          {HE.plot.gather}
        </button>
      )}

      {plot.state === "growing" && <ProgressRing plot={plot} />}

      {showFloat && (
        <span className={styles.floatUp}>
          {isGrapes ? "+15 🍇" : isBarley ? "+12 🌿" : "+10 🌾"}
        </span>
      )}
    </div>
  );
};
