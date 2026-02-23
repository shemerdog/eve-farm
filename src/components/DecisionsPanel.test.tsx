import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { DecisionsPanel } from "./DecisionsPanel";

const mockToggleDecisionEnabled = vi.fn();

// Default mock state: no encountered dilemmas
let mockEncounteredDilemmas: string[] = [];
let mockSavedFieldDecisions: Record<
  string,
  { choiceIndex: number; cyclesRemaining: number; enabled: boolean }
> = {};

vi.mock("@/store/gameStore", () => ({
  useGameStore: (selector: (s: object) => unknown) =>
    selector({
      encounteredDilemmas: mockEncounteredDilemmas,
      savedFieldDecisions: mockSavedFieldDecisions,
      toggleDecisionEnabled: mockToggleDecisionEnabled,
    }),
}));

beforeEach(() => {
  mockToggleDecisionEnabled.mockReset();
  mockEncounteredDilemmas = [];
  mockSavedFieldDecisions = {};
});

const mockOnClose = vi.fn();

describe("DecisionsPanel — empty state", () => {
  test("renders the panel title", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    expect(screen.getByText("נהל החלטות")).toBeInTheDocument();
  });

  test("shows empty state message when no encountered dilemmas", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    expect(
      screen.getByText("עדיין לא נתקלת בהחלטות שניתן לשמור"),
    ).toBeInTheDocument();
  });

  test("renders a close button", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    expect(screen.getByRole("button", { name: /✕/ })).toBeInTheDocument();
  });

  test("close button calls onClose", async () => {
    const onClose = vi.fn();
    render(<DecisionsPanel onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /✕/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("clicking backdrop calls onClose", async () => {
    const onClose = vi.fn();
    const { container } = render(<DecisionsPanel onClose={onClose} />);
    // The backdrop is the outermost div; click on it directly
    const backdrop = container.firstChild as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("DecisionsPanel — with encountered dilemmas", () => {
  beforeEach(() => {
    mockEncounteredDilemmas = ["peah:wheat"];
    mockSavedFieldDecisions = {
      "peah:wheat": { choiceIndex: 0, cyclesRemaining: 3, enabled: true },
    };
  });

  test("shows a list item for encountered peah:wheat", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    // The PEAH dilemma title should appear
    expect(
      screen.getByText("פֵּאָה — פִּנַּת הַשָּׂדֶה"),
    ).toBeInTheDocument();
  });

  test("checkbox is checked when decision is active and enabled", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  test("checkbox is enabled when cyclesRemaining > 0", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.disabled).toBe(false);
  });

  test("shows cycles-remaining badge", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    // Badge shows "3 מחזורים נותרו" or similar
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  test("clicking checkbox calls toggleDecisionEnabled with the key", async () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(mockToggleDecisionEnabled).toHaveBeenCalledOnce();
    expect(mockToggleDecisionEnabled).toHaveBeenCalledWith("peah:wheat");
  });
});

describe("DecisionsPanel — expired decision (cyclesRemaining = 0)", () => {
  beforeEach(() => {
    mockEncounteredDilemmas = ["peah:wheat"];
    mockSavedFieldDecisions = {
      "peah:wheat": { choiceIndex: 0, cyclesRemaining: 0, enabled: true },
    };
  });

  test("checkbox is disabled when cyclesRemaining is 0", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });
});

describe("DecisionsPanel — no saved choice yet", () => {
  beforeEach(() => {
    mockEncounteredDilemmas = ["shikchah:wheat"];
    mockSavedFieldDecisions = {};
  });

  test("shows no-saved-choice note", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    expect(screen.getByText("ללא בחירה שמורה")).toBeInTheDocument();
  });

  test("checkbox is disabled when no saved choice", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });
});

describe("DecisionsPanel — filters non-saveable dilemma IDs", () => {
  beforeEach(() => {
    // ORLAH and NETA_REVAI are not saveable; should not appear
    mockEncounteredDilemmas = ["peah:wheat", "orlah:grapes", "neta_revai:grapes"];
    mockSavedFieldDecisions = {
      "peah:wheat": { choiceIndex: 0, cyclesRemaining: 2, enabled: true },
    };
  });

  test("shows only saveable dilemma entries (peah, shikchah)", () => {
    render(<DecisionsPanel onClose={mockOnClose} />);
    const checkboxes = screen.getAllByRole("checkbox");
    // Only peah:wheat should be shown, not orlah or neta_revai
    expect(checkboxes).toHaveLength(1);
  });
});
