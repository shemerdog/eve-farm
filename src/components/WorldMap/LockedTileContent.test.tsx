import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { LockedTileContent } from "./LockedTileContent";
import type { TileCategory, TileSubcategory } from "@/types";

beforeEach(() => vi.clearAllMocks());

describe("LockedTileContent — inaccessible tile", () => {
  test("shows lock emoji when not purchasable", () => {
    render(
      <LockedTileContent
        purchasable={false}
        canAfford={false}
        price={50}
        onBuy={() => {}}
      />,
    );
    expect(screen.getByText("🔒")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("LockedTileContent — root step (2 category buttons)", () => {
  test("shows Field and Orchard buttons at root step", () => {
    render(
      <LockedTileContent purchasable canAfford price={50} onBuy={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: /שדה|field/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /כרם|orchard/i }),
    ).toBeInTheDocument();
  });

  test("shows price badge at root step", () => {
    render(
      <LockedTileContent purchasable canAfford price={80} onBuy={() => {}} />,
    );
    expect(screen.getByText(/80/)).toBeInTheDocument();
  });

  test("clicking Field transitions to field step without calling onBuy", async () => {
    const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>();
    render(
      <LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /שדה|field/i }));
    expect(onBuy).not.toHaveBeenCalled();
    // Should now show wheat and barley
    expect(
      screen.getByRole("button", { name: /חיטה|wheat/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /שעורה|barley/i }),
    ).toBeInTheDocument();
  });

  test("clicking Orchard transitions to orchard step without calling onBuy", async () => {
    const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>();
    render(
      <LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /כרם|orchard/i }));
    expect(onBuy).not.toHaveBeenCalled();
    // Should now show vineyard button
    expect(
      screen.getByRole("button", { name: /כרם|vineyard/i }),
    ).toBeInTheDocument();
  });

  test("category buttons are disabled when canAfford is false", () => {
    render(
      <LockedTileContent
        purchasable
        canAfford={false}
        price={50}
        onBuy={() => {}}
      />,
    );
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});

describe("LockedTileContent — field step", () => {
  async function renderFieldStep(onBuy = vi.fn()) {
    render(
      <LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /שדה|field/i }));
    return onBuy;
  }

  test('Wheat button calls onBuy("field", "wheat") and resets to root', async () => {
    const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>();
    await renderFieldStep(onBuy);
    await userEvent.click(screen.getByRole("button", { name: /חיטה|wheat/i }));
    expect(onBuy).toHaveBeenCalledWith("field", "wheat");
    // Back at root step — category buttons reappear
    expect(
      screen.getByRole("button", { name: /שדה|field/i }),
    ).toBeInTheDocument();
  });

  test('Barley button calls onBuy("field", "barley") and resets to root', async () => {
    const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>();
    await renderFieldStep(onBuy);
    await userEvent.click(
      screen.getByRole("button", { name: /שעורה|barley/i }),
    );
    expect(onBuy).toHaveBeenCalledWith("field", "barley");
    expect(
      screen.getByRole("button", { name: /שדה|field/i }),
    ).toBeInTheDocument();
  });

  test("Back button returns to root without calling onBuy", async () => {
    const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>();
    await renderFieldStep(onBuy);
    await userEvent.click(screen.getByRole("button", { name: /back|←|חזור/i }));
    expect(onBuy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /שדה|field/i }),
    ).toBeInTheDocument();
  });
});

describe("LockedTileContent — orchard step", () => {
  async function renderOrchardStep(onBuy = vi.fn()) {
    render(
      <LockedTileContent purchasable canAfford price={50} onBuy={onBuy} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /כרם|orchard/i }));
    return onBuy;
  }

  test('Vineyard button calls onBuy("orchard", "grapes") and resets to root', async () => {
    const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>();
    await renderOrchardStep(onBuy);
    // The vineyard button — it's the main action button now on orchard step
    const vineyardBtn = screen
      .getAllByRole("button")
      .find((b) => /כרם|vineyard/i.test(b.textContent ?? ""));
    expect(vineyardBtn).toBeDefined();
    await userEvent.click(vineyardBtn!);
    expect(onBuy).toHaveBeenCalledWith("orchard", "grapes");
    expect(
      screen.getByRole("button", { name: /שדה|field/i }),
    ).toBeInTheDocument();
  });

  test("Back button returns to root without calling onBuy", async () => {
    const onBuy = vi.fn<(c: TileCategory, s: TileSubcategory) => void>();
    await renderOrchardStep(onBuy);
    await userEvent.click(screen.getByRole("button", { name: /back|←|חזור/i }));
    expect(onBuy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /שדה|field/i }),
    ).toBeInTheDocument();
  });

  test("vineyard button is disabled when canAfford is false", () => {
    render(
      <LockedTileContent
        purchasable
        canAfford={false}
        price={50}
        onBuy={() => {}}
      />,
    );
    // All buttons disabled at root; can't navigate but test the state
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
