import { render, screen, fireEvent } from "@testing-library/react";
import { computeEffectiveIsOpen } from "@/lib/restaurant-hours";
import { RestaurantStatusCard } from "@/components/settings/restaurant-status-card";

// ─── computeEffectiveIsOpen ───────────────────────────────────────────────────

describe("computeEffectiveIsOpen", () => {
  const mockNow = (h: number, m: number) => {
    jest.spyOn(global, "Date").mockImplementation(
      () => ({ getHours: () => h, getMinutes: () => m } as unknown as Date)
    );
  };

  afterEach(() => jest.restoreAllMocks());

  describe("manual mode (useSchedule = false)", () => {
    it("returns true when manualIsOpen is true", () => {
      expect(
        computeEffectiveIsOpen({ useSchedule: false, manualIsOpen: true, windows: [] })
      ).toBe(true);
    });

    it("returns false when manualIsOpen is false", () => {
      expect(
        computeEffectiveIsOpen({ useSchedule: false, manualIsOpen: false, windows: [] })
      ).toBe(false);
    });

    it("ignores time windows entirely", () => {
      mockNow(12, 0);
      expect(
        computeEffectiveIsOpen({
          useSchedule: false,
          manualIsOpen: false,
          windows: [{ open: "11:45", close: "14:15" }],
        })
      ).toBe(false);
    });
  });

  describe("schedule mode (useSchedule = true)", () => {
    const windows = [
      { open: "11:45", close: "14:15" },
      { open: "18:30", close: "22:30" },
    ];

    it("is open during first service window", () => {
      mockNow(12, 0);
      expect(computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows })).toBe(
        true
      );
    });

    it("is open at exact start of first service", () => {
      mockNow(11, 45);
      expect(computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows })).toBe(
        true
      );
    });

    it("is closed at exact close of first service (exclusive upper bound)", () => {
      mockNow(14, 15);
      expect(computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows })).toBe(
        false
      );
    });

    it("is closed between services", () => {
      mockNow(16, 0);
      expect(computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows })).toBe(
        false
      );
    });

    it("is open during second service window", () => {
      mockNow(20, 0);
      expect(computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows })).toBe(
        true
      );
    });

    it("is closed after second service ends", () => {
      mockNow(22, 30);
      expect(computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows })).toBe(
        false
      );
    });

    it("is closed before opening", () => {
      mockNow(10, 0);
      expect(computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows })).toBe(
        false
      );
    });

    it("falls back to default windows when none provided", () => {
      mockNow(12, 0);
      expect(
        computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows: [] })
      ).toBe(true);
    });

    it("handles midnight-spanning window", () => {
      const nightWindows = [{ open: "23:00", close: "01:00" }];
      mockNow(23, 30);
      expect(
        computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows: nightWindows })
      ).toBe(true);
      mockNow(0, 30);
      expect(
        computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows: nightWindows })
      ).toBe(true);
      mockNow(1, 0);
      expect(
        computeEffectiveIsOpen({ useSchedule: true, manualIsOpen: false, windows: nightWindows })
      ).toBe(false);
    });
  });
});

// ─── RestaurantStatusCard ─────────────────────────────────────────────────────

const defaultWindows = [
  { open: "11:45", close: "14:15" },
  { open: "18:30", close: "22:30" },
];

const defaultSettings = {
  isOpen: true,
  useSchedule: false,
  manualIsOpen: true,
  windows: defaultWindows,
};

const mockProps = {
  settings: defaultSettings,
  savedWindows: defaultWindows,
  loading: false,
  onSave: jest.fn(),
  onWindowChange: jest.fn(),
};

describe("RestaurantStatusCard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the card title", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    expect(screen.getByText("Statut du Restaurant")).toBeInTheDocument();
  });

  it("shows Ouvert when isOpen is true", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    expect(screen.getByText("Ouvert")).toBeInTheDocument();
  });

  it("shows Ferme when isOpen is false", () => {
    render(
      <RestaurantStatusCard {...mockProps} settings={{ ...defaultSettings, isOpen: false }} />
    );
    expect(screen.getByText("Ferme")).toBeInTheDocument();
  });

  it("renders both switches", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(2);
  });

  it("manual switch is checked when manualIsOpen is true", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    const [manualSwitch] = screen.getAllByRole("switch");
    expect(manualSwitch).toBeChecked();
  });

  it("manual switch is unchecked when manualIsOpen is false", () => {
    render(
      <RestaurantStatusCard
        {...mockProps}
        settings={{ ...defaultSettings, manualIsOpen: false }}
      />
    );
    const [manualSwitch] = screen.getAllByRole("switch");
    expect(manualSwitch).not.toBeChecked();
  });

  it("schedule switch is checked when useSchedule is true", () => {
    render(
      <RestaurantStatusCard
        {...mockProps}
        settings={{ ...defaultSettings, useSchedule: true }}
      />
    );
    const [, scheduleSwitch] = screen.getAllByRole("switch");
    expect(scheduleSwitch).toBeChecked();
  });

  it("calls onSave with manualIsOpen when manual switch is toggled", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    const [manualSwitch] = screen.getAllByRole("switch");
    fireEvent.click(manualSwitch);
    expect(mockProps.onSave).toHaveBeenCalledWith({ manualIsOpen: false });
  });

  it("calls onSave with useSchedule when schedule switch is toggled", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    const [, scheduleSwitch] = screen.getAllByRole("switch");
    fireEvent.click(scheduleSwitch);
    expect(mockProps.onSave).toHaveBeenCalledWith({ useSchedule: true });
  });

  it("manual switch is disabled when useSchedule is active", () => {
    render(
      <RestaurantStatusCard
        {...mockProps}
        settings={{ ...defaultSettings, useSchedule: true }}
      />
    );
    const [manualSwitch] = screen.getAllByRole("switch");
    expect(manualSwitch).toBeDisabled();
  });

  it("renders time inputs for each window", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    const inputs = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/);
    expect(inputs).toHaveLength(4); // 2 windows × open + close
  });

  it("calls onWindowChange when a time input is changed", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    const [firstOpenInput] = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/);
    fireEvent.change(firstOpenInput, { target: { value: "12:00" } });
    expect(mockProps.onWindowChange).toHaveBeenCalledWith(0, "open", "12:00");
  });

  it("renders the save schedule button", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    expect(
      screen.getByRole("button", { name: "Enregistrer les horaires" })
    ).toBeInTheDocument();
  });

  it("save button is disabled when windows match saved windows", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    expect(screen.getByRole("button", { name: "Enregistrer les horaires" })).toBeDisabled();
  });

  it("save button is enabled when windows differ from saved windows", () => {
    const dirtyWindows = [
      { open: "12:00", close: "14:15" },
      { open: "18:30", close: "22:30" },
    ];
    render(
      <RestaurantStatusCard
        {...mockProps}
        settings={{ ...defaultSettings, windows: dirtyWindows }}
        savedWindows={defaultWindows}
      />
    );
    expect(screen.getByRole("button", { name: "Enregistrer les horaires" })).not.toBeDisabled();
  });

  it("calls onSave with windows when save button is clicked", () => {
    const dirtyWindows = [
      { open: "12:00", close: "14:15" },
      { open: "18:30", close: "22:30" },
    ];
    render(
      <RestaurantStatusCard
        {...mockProps}
        settings={{ ...defaultSettings, windows: dirtyWindows }}
        savedWindows={defaultWindows}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer les horaires" }));
    expect(mockProps.onSave).toHaveBeenCalledWith({ windows: dirtyWindows });
  });

  it("shows loading state on save button", () => {
    render(<RestaurantStatusCard {...mockProps} loading={true} />);
    expect(screen.getByRole("button", { name: "Enregistrement..." })).toBeDisabled();
  });

  it("disables all switches and inputs when loading", () => {
    render(<RestaurantStatusCard {...mockProps} loading={true} />);
    screen.getAllByRole("switch").forEach((s) => expect(s).toBeDisabled());
    screen
      .getAllByDisplayValue(/^\d{2}:\d{2}$/)
      .forEach((input) => expect(input).toBeDisabled());
  });

  it("shows schedule mode hint when useSchedule is enabled", () => {
    render(
      <RestaurantStatusCard
        {...mockProps}
        settings={{ ...defaultSettings, useSchedule: true }}
      />
    );
    expect(screen.getByText("Désactivé — le mode horaire est actif.")).toBeInTheDocument();
  });

  it("shows manual mode hint when useSchedule is disabled", () => {
    render(<RestaurantStatusCard {...mockProps} />);
    expect(screen.getByText("Ouvrir ou fermer manuellement.")).toBeInTheDocument();
  });
});
