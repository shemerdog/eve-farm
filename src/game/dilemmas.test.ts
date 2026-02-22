import { describe, it, expect } from "vitest";
import { DILEMMAS, ORLAH_DILEMMA } from "./dilemmas";

describe("ORLAH_DILEMMA", () => {
  it("has id 'orlah'", () => {
    expect(ORLAH_DILEMMA.id).toBe("orlah");
  });

  it("has exactly 3 choices", () => {
    expect(ORLAH_DILEMMA.choices).toHaveLength(3);
  });

  it("first choice (leave fruit) gives morality and devotion gain", () => {
    const choice = ORLAH_DILEMMA.choices[0];
    expect(choice.meterEffect.morality).toBeGreaterThan(0);
    expect(choice.meterEffect.devotion).toBeGreaterThan(0);
  });

  it("third choice (take all) causes meter loss", () => {
    const choice = ORLAH_DILEMMA.choices[2];
    const hasLoss =
      (choice.meterEffect.morality ?? 0) < 0 ||
      (choice.meterEffect.devotion ?? 0) < 0 ||
      (choice.meterEffect.faithfulness ?? 0) < 0;
    expect(hasLoss).toBe(true);
  });

  it("is included in DILEMMAS array", () => {
    expect(DILEMMAS.find((d) => d.id === "orlah")).toBeDefined();
  });
});

describe("DILEMMAS — shikchah", () => {
  const shikchah = DILEMMAS.find((d) => d.id === "shikchah");

  it("exists in the DILEMMAS array", () => {
    expect(shikchah).toBeDefined();
  });

  it("has a Hebrew title mentioning שכחה", () => {
    expect(shikchah?.title).toContain("שִׁכְחָה");
  });

  it("has a narrative describing the forgotten-sheaf situation", () => {
    expect(shikchah?.narrative).toBeTruthy();
    expect(shikchah?.narrative.length).toBeGreaterThan(20);
  });

  it("has exactly 3 choices", () => {
    expect(shikchah?.choices).toHaveLength(3);
  });

  it("choice 0 leaves 2 sheaves — costs 2 wheat and boosts morality", () => {
    const choice = shikchah?.choices[0];
    expect(choice?.wheatCost).toBe(2);
    expect(choice?.meterEffect.morality ?? 0).toBeGreaterThan(0);
  });

  it("choice 1 leaves 1 sheaf — costs 1 wheat and boosts morality", () => {
    const choice = shikchah?.choices[1];
    expect(choice?.wheatCost).toBe(1);
    expect(choice?.meterEffect.morality ?? 0).toBeGreaterThan(0);
  });

  it("choice 2 takes all — costs 0 wheat and penalises morality", () => {
    const choice = shikchah?.choices[2];
    expect(choice?.wheatCost).toBe(0);
    expect(choice?.meterEffect.morality ?? 0).toBeLessThan(0);
  });

  it("all choices have non-empty label and description", () => {
    for (const choice of shikchah?.choices ?? []) {
      expect(choice.label).toBeTruthy();
      expect(choice.description).toBeTruthy();
    }
  });
});

describe("DILEMMAS — omer is removed", () => {
  it("does not contain omer in the DILEMMAS array", () => {
    expect(DILEMMAS.find((d) => d.id === "omer")).toBeUndefined();
  });
});
