import { describe, it, expect } from "vitest";
import { tickPlot, growthProgress } from "./gameTick";
import type { Plot } from "@/types";

const makePlot = (overrides: Partial<Plot> = {}): Plot => ({
  id: "2_2_0",
  state: "growing",
  plantedAt: Date.now(),
  growthDuration: 15_000,
  tileCoord: { col: 2, row: 2 },
  ...overrides,
});

describe("tickPlot", () => {
  it("transitions growing plot to ready after growthDuration has elapsed", () => {
    const now = Date.now();
    const plot = makePlot({ plantedAt: now - 16_000 });
    const result = tickPlot(plot, now);
    expect(result.state).toBe("ready");
  });

  it("leaves growing plot unchanged when growthDuration has not elapsed", () => {
    const now = Date.now();
    const plot = makePlot({ plantedAt: now - 5_000 });
    const result = tickPlot(plot, now);
    expect(result.state).toBe("growing");
  });

  it("transitions exactly at growthDuration boundary", () => {
    const now = Date.now();
    const plot = makePlot({ plantedAt: now - 15_000 });
    const result = tickPlot(plot, now);
    expect(result.state).toBe("ready");
  });

  it("does not modify plots that are not in growing state", () => {
    const emptyPlot = makePlot({ state: "empty", plantedAt: null });
    expect(tickPlot(emptyPlot).state).toBe("empty");

    const readyPlot = makePlot({ state: "ready" });
    expect(tickPlot(readyPlot).state).toBe("ready");

    const harvestedPlot = makePlot({ state: "harvested" });
    expect(tickPlot(harvestedPlot).state).toBe("harvested");
  });

  it("does not modify a growing plot with null plantedAt", () => {
    const plot = makePlot({ plantedAt: null });
    const result = tickPlot(plot);
    expect(result.state).toBe("growing");
  });

  it("returns a new object reference on state change", () => {
    const now = Date.now();
    const plot = makePlot({ plantedAt: now - 20_000 });
    const result = tickPlot(plot, now);
    expect(result).not.toBe(plot);
  });

  it("returns the same object reference when state does not change", () => {
    const now = Date.now();
    const plot = makePlot({ plantedAt: now - 1_000 });
    const result = tickPlot(plot, now);
    expect(result).toBe(plot);
  });
});

describe("growthProgress", () => {
  it("returns 0 for non-growing plots", () => {
    expect(growthProgress(makePlot({ state: "empty", plantedAt: null }))).toBe(
      0,
    );
    expect(growthProgress(makePlot({ state: "ready" }))).toBe(0);
  });

  it("returns 0 for growing plot with null plantedAt", () => {
    expect(growthProgress(makePlot({ plantedAt: null }))).toBe(0);
  });

  it("returns value between 0 and 1 during growth", () => {
    const now = Date.now();
    const plot = makePlot({ plantedAt: now - 7_500 }); // halfway through 15s
    const progress = growthProgress(plot, now);
    expect(progress).toBeCloseTo(0.5);
  });

  it("clamps to 1 when past growthDuration", () => {
    const now = Date.now();
    const plot = makePlot({ plantedAt: now - 30_000 });
    expect(growthProgress(plot, now)).toBe(1);
  });
});
