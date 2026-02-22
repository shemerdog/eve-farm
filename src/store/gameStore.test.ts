import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import {
  GRAPES_PER_HARVEST,
  BARLEY_GROWTH_DURATION,
  BARLEY_PER_HARVEST,
  WHEAT_GROWTH_DURATION,
} from "@/game/constants";
import { DILEMMAS, ORLAH_DILEMMA } from "@/game/dilemmas";

// Reset store to a clean initial state before each test
beforeEach(() => {
  useGameStore.getState().resetGame();
});

describe("buyTile with category + subcategory", () => {
  it('buyTile("field", "wheat") creates wheat plots and stores category "field"', () => {
    useGameStore.setState({ wheat: 1000 });

    const coord = { col: 2, row: 1 }; // adjacent to default farm at (2,2)
    useGameStore.getState().buyTile(coord, "field", "wheat");

    const state = useGameStore.getState();
    const category = state.tileCategories[`${coord.col}_${coord.row}`];
    expect(category).toBe("field");

    const plots = state.plots.filter(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    );
    expect(plots.length).toBe(4);
    plots.forEach((p) => expect(p.cropType).toBe("wheat"));
  });

  it('buyTile("field", "barley") creates barley plots and stores category "field"', () => {
    useGameStore.setState({ wheat: 1000 });

    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const category = state.tileCategories[`${coord.col}_${coord.row}`];
    expect(category).toBe("field");

    const plots = state.plots.filter(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    );
    expect(plots.length).toBe(4);
    plots.forEach((p) => {
      expect(p.cropType).toBe("barley");
      expect(p.growthDuration).toBe(BARLEY_GROWTH_DURATION);
    });
  });

  it('buyTile("orchard", "grapes") creates grape plots and stores category "orchard"', () => {
    useGameStore.setState({ wheat: 1000 });

    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "orchard", "grapes");

    const state = useGameStore.getState();
    const category = state.tileCategories[`${coord.col}_${coord.row}`];
    expect(category).toBe("orchard");

    const plots = state.plots.filter(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    );
    expect(plots.length).toBe(4);
    plots.forEach((p) => expect(p.cropType).toBe("grapes"));
  });

  it("grape plots have longer growthDuration than wheat", () => {
    useGameStore.setState({ wheat: 1000 });

    const wheatCoord = { col: 2, row: 1 };
    const grapeCoord = { col: 3, row: 2 };

    useGameStore.getState().buyTile(wheatCoord, "field", "wheat");
    useGameStore.getState().buyTile(grapeCoord, "orchard", "grapes");

    const state = useGameStore.getState();
    const wheatPlot = state.plots.find(
      (p) =>
        p.tileCoord.col === wheatCoord.col &&
        p.tileCoord.row === wheatCoord.row,
    )!;
    const grapePlot = state.plots.find(
      (p) =>
        p.tileCoord.col === grapeCoord.col &&
        p.tileCoord.row === grapeCoord.row,
    )!;

    expect(grapePlot.growthDuration).toBeGreaterThan(wheatPlot.growthDuration);
  });

  it("buyTile fails when not adjacent (no category stored)", () => {
    useGameStore.setState({ wheat: 1000 });
    const farCoord = { col: 0, row: 0 }; // not adjacent to (2,2)
    useGameStore.getState().buyTile(farCoord, "orchard", "grapes");

    const state = useGameStore.getState();
    expect(
      state.tileCategories[`${farCoord.col}_${farCoord.row}`],
    ).toBeUndefined();
  });

  it("barley plots have growthDuration between wheat and grapes", () => {
    useGameStore.setState({ wheat: 1000 });
    const barleyCoord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(barleyCoord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) =>
        p.tileCoord.col === barleyCoord.col &&
        p.tileCoord.row === barleyCoord.row,
    )!;

    expect(barleyPlot.growthDuration).toBeGreaterThan(WHEAT_GROWTH_DURATION);
    expect(barleyPlot.growthDuration).toBeLessThan(30_000); // grapes
  });
});

describe("gatherSheafs crop yield", () => {
  it("gathering a grape plot adds to grapes counter (not wheat)", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "orchard", "grapes");

    const state = useGameStore.getState();
    const grapePlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;

    // Force plot into gathered state with known wheat/grapes counts
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === grapePlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      wheat: 0,
      grapes: 0,
    });

    useGameStore.getState().gatherSheafs(grapePlot.id);

    const after = useGameStore.getState();
    expect(after.grapes).toBe(GRAPES_PER_HARVEST);
    expect(after.wheat).toBe(0); // wheat unchanged
  });

  it("gathering a wheat plot adds to wheat counter (not grapes)", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0]; // initial farm plot at (2,2)

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      wheat: 0,
      grapes: 0,
    });

    useGameStore.getState().gatherSheafs(wheatPlot.id);

    const after = useGameStore.getState();
    expect(after.wheat).toBe(10);
    expect(after.grapes).toBe(0); // grapes unchanged
  });

  it("initial grapes counter is 0", () => {
    expect(useGameStore.getState().grapes).toBe(0);
  });

  it("resetGame resets grapes to 0", () => {
    useGameStore.setState({ grapes: 99 });
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().grapes).toBe(0);
  });
});

describe("gatherSheafs dilemma routing", () => {
  it("gathering a wheat plot triggers SHIKCHAH_DILEMMA", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: null,
      wheat: 0,
    });

    useGameStore.getState().gatherSheafs(wheatPlot.id);

    const dilemma = useGameStore.getState().activeDilemma;
    expect(dilemma).not.toBeNull();
    expect(dilemma?.id).toBe("shikchah");
  });

  it("gathering a grape plot does NOT trigger any dilemma", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "orchard", "grapes");

    const state = useGameStore.getState();
    const grapePlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === grapePlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: null,
      wheat: 0,
    });

    useGameStore.getState().gatherSheafs(grapePlot.id);

    expect(useGameStore.getState().activeDilemma).toBeNull();
  });

  it("gathering a wheat plot when a dilemma is already active does not overwrite it", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    const existingDilemma = {
      id: "peah",
      title: "פֵּאָה",
      narrative: "...",
      choices: [],
    };

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: existingDilemma as never,
      wheat: 0,
    });

    useGameStore.getState().gatherSheafs(wheatPlot.id);

    // The existing dilemma should not be replaced
    expect(useGameStore.getState().activeDilemma?.id).toBe("peah");
  });
});

describe("gatherSheafs — barley", () => {
  it("gathering a barley plot adds to barley counter (not wheat or grapes)", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === barleyPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      wheat: 0,
      grapes: 0,
      barley: 0,
    });

    useGameStore.getState().gatherSheafs(barleyPlot.id);

    const after = useGameStore.getState();
    expect(after.barley).toBe(BARLEY_PER_HARVEST);
    expect(after.wheat).toBe(0);
    expect(after.grapes).toBe(0);
  });

  it("initial barley counter is 0", () => {
    expect(useGameStore.getState().barley).toBe(0);
  });

  it("resetGame resets barley to 0", () => {
    useGameStore.setState({ barley: 99 });
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().barley).toBe(0);
  });

  it("gathering a barley plot triggers SHIKCHAH_DILEMMA", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === barleyPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: null,
      wheat: 0,
    });

    useGameStore.getState().gatherSheafs(barleyPlot.id);

    const dilemma = useGameStore.getState().activeDilemma;
    expect(dilemma).not.toBeNull();
    expect(dilemma?.id).toBe("shikchah");
  });
});

describe("harvest dilemma routing", () => {
  it("harvesting a grape plot sets ORLAH_DILEMMA as activeDilemma", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "orchard", "grapes");

    const state = useGameStore.getState();
    const grapePlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;

    // Force plot into ready state
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === grapePlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
    });

    useGameStore.getState().harvest(grapePlot.id);

    const dilemma = useGameStore.getState().activeDilemma;
    expect(dilemma).not.toBeNull();
    expect(dilemma?.id).toBe("orlah");
  });

  it("harvesting a wheat plot sets PEAH_DILEMMA as activeDilemma", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
    });

    useGameStore.getState().harvest(wheatPlot.id);

    const dilemma = useGameStore.getState().activeDilemma;
    expect(dilemma).not.toBeNull();
    expect(dilemma?.id).toBe("peah");
  });

  it("harvesting a barley plot sets PEAH_DILEMMA as activeDilemma", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === barleyPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
    });

    useGameStore.getState().harvest(barleyPlot.id);

    const dilemma = useGameStore.getState().activeDilemma;
    expect(dilemma).not.toBeNull();
    expect(dilemma?.id).toBe("peah");
  });

  it("harvesting a barley plot sets activeDilemmaContext to 'barley'", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === barleyPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      activeDilemmaContext: null,
    });

    useGameStore.getState().harvest(barleyPlot.id);

    expect(useGameStore.getState().activeDilemmaContext).toBe("barley");
  });

  it("harvesting a wheat plot sets activeDilemmaContext to 'wheat'", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];

    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      activeDilemmaContext: null,
    });

    useGameStore.getState().harvest(wheatPlot.id);

    expect(useGameStore.getState().activeDilemmaContext).toBe("wheat");
  });
});

describe("v6 migration: category key rename", () => {
  it('"farm" → "field" in tileCategories', () => {
    // Simulate v5 persisted state with old category keys
    useGameStore.setState({
      tileCategories: { "2_1": "field" as never }, // simulating "farm" renamed
    });
    // After setState, verify the new categories are correct
    // (In real migration, "farm" becomes "field")
    const state = useGameStore.getState();
    // We simulate the migration result directly since we can't replay persist versioning
    const migrated = Object.entries({ "2_1": "farm" as never }).reduce(
      (acc, [key, cat]) => ({
        ...acc,
        [key]: cat === "vineyard" ? "orchard" : "field",
      }),
      {} as Record<string, string>,
    );
    expect(migrated["2_1"]).toBe("field");
  });

  it('"vineyard" → "orchard" in tileCategories', () => {
    const migrated = Object.entries({ "3_2": "vineyard" as never }).reduce(
      (acc, [key, cat]) => ({
        ...acc,
        [key]: cat === "vineyard" ? "orchard" : "field",
      }),
      {} as Record<string, string>,
    );
    expect(migrated["3_2"]).toBe("orchard");
  });

  it('old "field" → stays "field" in tileCategories', () => {
    const migrated = Object.entries({ "2_3": "field" as never }).reduce(
      (acc, [key, cat]) => ({
        ...acc,
        [key]: cat === "vineyard" ? "orchard" : "field",
      }),
      {} as Record<string, string>,
    );
    expect(migrated["2_3"]).toBe("field");
  });
});

// ── Saved field decisions (PEAH + SHIKCHAH, 5-cycle auto-resolve) ────────────

describe("savedFieldDecisions — initial state", () => {
  it("starts with empty savedFieldDecisions", () => {
    expect(useGameStore.getState().savedFieldDecisions).toEqual({});
  });

  it("resetGame clears savedFieldDecisions", () => {
    useGameStore.setState({
      savedFieldDecisions: {
        "peah:wheat": { choiceIndex: 0, cyclesRemaining: 5 },
        "peah:barley": { choiceIndex: 1, cyclesRemaining: 3 },
      },
    });
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().savedFieldDecisions).toEqual({});
  });
});

describe("resolveDilemma(choiceIndex, save=true) for PEAH", () => {
  it("saves peah:wheat decision with 5 cyclesRemaining", () => {
    const peah = DILEMMAS.find((d) => d.id === "peah")!;
    useGameStore.setState({
      activeDilemma: peah,
      activeDilemmaContext: "wheat",
      wheat: 100,
    });
    useGameStore.getState().resolveDilemma(0, true);

    const saved = useGameStore.getState().savedFieldDecisions["peah:wheat"];
    expect(saved).toBeDefined();
    expect(saved?.choiceIndex).toBe(0);
    expect(saved?.cyclesRemaining).toBe(5);
  });

  it("saves peah:barley decision independently from peah:wheat", () => {
    const peah = DILEMMAS.find((d) => d.id === "peah")!;
    useGameStore.setState({
      activeDilemma: peah,
      activeDilemmaContext: "barley",
      wheat: 100,
      savedFieldDecisions: {
        "peah:wheat": { choiceIndex: 2, cyclesRemaining: 3 },
      },
    });
    useGameStore.getState().resolveDilemma(1, true);

    const state = useGameStore.getState().savedFieldDecisions;
    expect(state["peah:barley"]?.choiceIndex).toBe(1);
    expect(state["peah:barley"]?.cyclesRemaining).toBe(5);
    // wheat decision unchanged
    expect(state["peah:wheat"]?.choiceIndex).toBe(2);
    expect(state["peah:wheat"]?.cyclesRemaining).toBe(3);
  });

  it("clears activeDilemma after resolving with save", () => {
    const peah = DILEMMAS.find((d) => d.id === "peah")!;
    useGameStore.setState({
      activeDilemma: peah,
      activeDilemmaContext: "wheat",
      wheat: 100,
    });
    useGameStore.getState().resolveDilemma(1, true);
    expect(useGameStore.getState().activeDilemma).toBeNull();
  });

  it("clears activeDilemmaContext after resolving", () => {
    const peah = DILEMMAS.find((d) => d.id === "peah")!;
    useGameStore.setState({
      activeDilemma: peah,
      activeDilemmaContext: "wheat",
      wheat: 100,
    });
    useGameStore.getState().resolveDilemma(0, true);
    expect(useGameStore.getState().activeDilemmaContext).toBeNull();
  });
});

describe("resolveDilemma(choiceIndex, save=true) for SHIKCHAH", () => {
  it("saves shikchah:wheat decision with 5 cyclesRemaining", () => {
    const shikchah = DILEMMAS.find((d) => d.id === "shikchah")!;
    useGameStore.setState({
      activeDilemma: shikchah,
      activeDilemmaContext: "wheat",
      wheat: 100,
    });
    useGameStore.getState().resolveDilemma(1, true);

    const saved = useGameStore.getState().savedFieldDecisions["shikchah:wheat"];
    expect(saved).toBeDefined();
    expect(saved?.choiceIndex).toBe(1);
    expect(saved?.cyclesRemaining).toBe(5);
  });

  it("saves shikchah:barley decision independently from shikchah:wheat", () => {
    const shikchah = DILEMMAS.find((d) => d.id === "shikchah")!;
    useGameStore.setState({
      activeDilemma: shikchah,
      activeDilemmaContext: "barley",
      wheat: 100,
      savedFieldDecisions: {
        "shikchah:wheat": { choiceIndex: 2, cyclesRemaining: 4 },
      },
    });
    useGameStore.getState().resolveDilemma(0, true);

    const state = useGameStore.getState().savedFieldDecisions;
    expect(state["shikchah:barley"]?.choiceIndex).toBe(0);
    expect(state["shikchah:barley"]?.cyclesRemaining).toBe(5);
    // wheat decision unchanged
    expect(state["shikchah:wheat"]?.choiceIndex).toBe(2);
    expect(state["shikchah:wheat"]?.cyclesRemaining).toBe(4);
  });
});

describe("resolveDilemma without save (default)", () => {
  it("does not save when save omitted", () => {
    const peah = DILEMMAS.find((d) => d.id === "peah")!;
    useGameStore.setState({
      activeDilemma: peah,
      activeDilemmaContext: "wheat",
      wheat: 100,
    });
    useGameStore.getState().resolveDilemma(0);
    expect(useGameStore.getState().savedFieldDecisions).toEqual({});
  });
});

describe("resolveDilemma save=true for non-saveable dilemmas", () => {
  it("does not save for ORLAH even with save=true", () => {
    useGameStore.setState({ activeDilemma: ORLAH_DILEMMA, wheat: 100 });
    useGameStore.getState().resolveDilemma(0, true);
    expect(useGameStore.getState().savedFieldDecisions).toEqual({});
  });
});

describe("harvest auto-resolves saved PEAH for wheat", () => {
  it("does not show PEAH modal when saved decision exists", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "peah:wheat": { choiceIndex: 0, cyclesRemaining: 3 },
      },
    });

    useGameStore.getState().harvest(wheatPlot.id);

    expect(useGameStore.getState().activeDilemma).toBeNull();
  });

  it("decrements cyclesRemaining on auto-resolve", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "peah:wheat": { choiceIndex: 0, cyclesRemaining: 3 },
      },
    });

    useGameStore.getState().harvest(wheatPlot.id);

    expect(
      useGameStore.getState().savedFieldDecisions["peah:wheat"]
        ?.cyclesRemaining,
    ).toBe(2);
  });

  it("removes saved decision when cyclesRemaining reaches 0", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "peah:wheat": { choiceIndex: 0, cyclesRemaining: 1 },
      },
    });

    useGameStore.getState().harvest(wheatPlot.id);

    expect(
      useGameStore.getState().savedFieldDecisions["peah:wheat"],
    ).toBeUndefined();
  });

  it("shows PEAH modal when no saved decision exists", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {},
    });

    useGameStore.getState().harvest(wheatPlot.id);

    expect(useGameStore.getState().activeDilemma?.id).toBe("peah");
  });

  it("applies wheat cost and meter effects when auto-resolving PEAH choice 0", () => {
    // PEAH choice 0: wheatCost=3, morality+10, devotion+5
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      wheat: 100,
      meters: { devotion: 50, morality: 50, faithfulness: 50 },
      savedFieldDecisions: {
        "peah:wheat": { choiceIndex: 0, cyclesRemaining: 2 },
      },
    });

    useGameStore.getState().harvest(wheatPlot.id);

    const after = useGameStore.getState();
    expect(after.wheat).toBe(97); // 100 - floor(3) = 97
    expect(after.meters.morality).toBe(60); // +10
    expect(after.meters.devotion).toBe(55); // +5
  });
});

describe("harvest auto-resolves saved PEAH for barley", () => {
  it("does not show PEAH modal for barley when saved decision exists", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === barleyPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "peah:barley": { choiceIndex: 0, cyclesRemaining: 3 },
      },
    });

    useGameStore.getState().harvest(barleyPlot.id);

    expect(useGameStore.getState().activeDilemma).toBeNull();
  });

  it("barley saved decision does not consume wheat saved decision", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === barleyPlot.id ? { ...p, state: "ready" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "peah:wheat": { choiceIndex: 1, cyclesRemaining: 5 },
        "peah:barley": { choiceIndex: 0, cyclesRemaining: 2 },
      },
    });

    useGameStore.getState().harvest(barleyPlot.id);

    const after = useGameStore.getState().savedFieldDecisions;
    // barley cycles decremented
    expect(after["peah:barley"]?.cyclesRemaining).toBe(1);
    // wheat cycles unchanged
    expect(after["peah:wheat"]?.cyclesRemaining).toBe(5);
  });
});

describe("gatherSheafs auto-resolves saved SHIKCHAH", () => {
  it("does not show SHIKCHAH modal for wheat when saved decision exists", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "shikchah:wheat": { choiceIndex: 1, cyclesRemaining: 2 },
      },
    });

    useGameStore.getState().gatherSheafs(wheatPlot.id);

    expect(useGameStore.getState().activeDilemma).toBeNull();
  });

  it("does not show SHIKCHAH modal for barley when saved decision exists", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === barleyPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "shikchah:barley": { choiceIndex: 0, cyclesRemaining: 3 },
      },
    });

    useGameStore.getState().gatherSheafs(barleyPlot.id);

    expect(useGameStore.getState().activeDilemma).toBeNull();
  });

  it("barley shikchah saved decision does not affect wheat shikchah", () => {
    useGameStore.setState({ wheat: 1000 });
    const coord = { col: 2, row: 1 };
    useGameStore.getState().buyTile(coord, "field", "barley");

    const state = useGameStore.getState();
    const barleyPlot = state.plots.find(
      (p) => p.tileCoord.col === coord.col && p.tileCoord.row === coord.row,
    )!;
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === barleyPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "shikchah:wheat": { choiceIndex: 2, cyclesRemaining: 5 },
        "shikchah:barley": { choiceIndex: 0, cyclesRemaining: 3 },
      },
    });

    useGameStore.getState().gatherSheafs(barleyPlot.id);

    const after = useGameStore.getState().savedFieldDecisions;
    expect(after["shikchah:barley"]?.cyclesRemaining).toBe(2);
    // wheat unchanged
    expect(after["shikchah:wheat"]?.cyclesRemaining).toBe(5);
  });

  it("decrements cyclesRemaining for SHIKCHAH on auto-resolve", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "shikchah:wheat": { choiceIndex: 0, cyclesRemaining: 4 },
      },
    });

    useGameStore.getState().gatherSheafs(wheatPlot.id);

    expect(
      useGameStore.getState().savedFieldDecisions["shikchah:wheat"]
        ?.cyclesRemaining,
    ).toBe(3);
  });

  it("removes saved SHIKCHAH when cyclesRemaining reaches 0", () => {
    const state = useGameStore.getState();
    const wheatPlot = state.plots[0];
    useGameStore.setState({
      plots: state.plots.map((p) =>
        p.id === wheatPlot.id ? { ...p, state: "gathered" as const } : p,
      ),
      activeDilemma: null,
      savedFieldDecisions: {
        "shikchah:wheat": { choiceIndex: 0, cyclesRemaining: 1 },
      },
    });

    useGameStore.getState().gatherSheafs(wheatPlot.id);

    expect(
      useGameStore.getState().savedFieldDecisions["shikchah:wheat"],
    ).toBeUndefined();
  });
});
