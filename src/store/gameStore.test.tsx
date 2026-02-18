import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import { FARM_COORD } from "@/game/worldMap";
import { calcTilePrice } from "@/game/constants";

// Reset store data between tests (don't use replace mode — it strips action functions)
beforeEach(() => {
  const initial = useGameStore.getInitialState();
  useGameStore.setState({
    plots: initial.plots,
    wheat: initial.wheat,
    meters: initial.meters,
    harvestsSinceLastDilemma: initial.harvestsSinceLastDilemma,
    dilemmaIndex: initial.dilemmaIndex,
    activeDilemma: initial.activeDilemma,
    purchasedCoords: initial.purchasedCoords,
  });
});

describe("gameStore — initial plots", () => {
  it("starts with 4 plots tagged with FARM_COORD", () => {
    const { plots } = useGameStore.getState();
    expect(plots).toHaveLength(4);
    for (const plot of plots) {
      expect(plot.tileCoord).toEqual(FARM_COORD);
    }
  });

  it("assigns string IDs in col_row_idx format", () => {
    const { plots } = useGameStore.getState();
    expect(plots.map((p) => p.id)).toEqual([
      "2_2_0",
      "2_2_1",
      "2_2_2",
      "2_2_3",
    ]);
  });
});

describe("gameStore — buyTile creates plots", () => {
  const adjacentCoord = { col: 3, row: 2 }; // adjacent to FARM_COORD

  it("creates 4 new plots when a tile is bought", () => {
    const price = calcTilePrice(0);
    useGameStore.setState({ wheat: price });

    useGameStore.getState().buyTile(adjacentCoord);

    const { plots } = useGameStore.getState();
    expect(plots).toHaveLength(8); // 4 original + 4 new
  });

  it("new plots are tagged with the purchased tile coord", () => {
    const price = calcTilePrice(0);
    useGameStore.setState({ wheat: price });

    useGameStore.getState().buyTile(adjacentCoord);

    const { plots } = useGameStore.getState();
    const newPlots = plots.filter(
      (p) =>
        p.tileCoord.col === adjacentCoord.col &&
        p.tileCoord.row === adjacentCoord.row,
    );
    expect(newPlots).toHaveLength(4);
    expect(newPlots.map((p) => p.id)).toEqual([
      "3_2_0",
      "3_2_1",
      "3_2_2",
      "3_2_3",
    ]);
  });

  it("new plots start in empty state", () => {
    const price = calcTilePrice(0);
    useGameStore.setState({ wheat: price });

    useGameStore.getState().buyTile(adjacentCoord);

    const { plots } = useGameStore.getState();
    const newPlots = plots.filter(
      (p) =>
        p.tileCoord.col === adjacentCoord.col &&
        p.tileCoord.row === adjacentCoord.row,
    );
    for (const plot of newPlots) {
      expect(plot.state).toBe("empty");
    }
  });

  it("does not create plots if purchase fails (not enough wheat)", () => {
    useGameStore.setState({ wheat: 0 });

    useGameStore.getState().buyTile(adjacentCoord);

    const { plots } = useGameStore.getState();
    expect(plots).toHaveLength(4); // only original plots
  });
});
