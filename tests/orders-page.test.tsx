import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ─── Firebase mocks ───────────────────────────────────────────────────────────
jest.mock("@/firebase/initialize", () => ({ firebaseMessaging: {} }));
jest.mock("firebase/messaging", () => ({
  getToken: jest.fn().mockResolvedValue(null),
  onMessage: jest.fn().mockReturnValue(() => {}),
}));

// ─── AudioContext mock ────────────────────────────────────────────────────────
const mockOscillator = {
  connect: jest.fn(),
  type: "",
  frequency: { value: 0 },
  start: jest.fn(),
  stop: jest.fn(),
};
const mockGain = {
  connect: jest.fn(),
  gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
};
const mockAudioContext = {
  state: "running",
  resume: jest.fn().mockResolvedValue(undefined),
  currentTime: 0,
  createOscillator: jest.fn().mockReturnValue(mockOscillator),
  createGain: jest.fn().mockReturnValue(mockGain),
  destination: {},
};
Object.defineProperty(global, "AudioContext", {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudioContext),
});

// ─── Notification mock ────────────────────────────────────────────────────────
Object.defineProperty(global, "Notification", {
  writable: true,
  value: Object.assign(jest.fn(), { permission: "default" }),
});

// ─── ServiceWorker mock ───────────────────────────────────────────────────────
Object.defineProperty(global.navigator, "serviceWorker", {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({ showNotification: jest.fn() }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
});

import OrdersPage from "@/app/(web)/dashboard/orders/page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOrder(i: number) {
  return {
    _id: `order-${i}`,
    customerName: `Client ${i}`,
    phone: `060000000${i}`,
    email: `client${i}@test.fr`,
    deliveryAddress: "",
    addressPincode: "",
    addressInstructions: "",
    orderType: "emporter" as const,
    items: [{ name: `Plat ${i}`, price: 10, quantity: 1, _subtotal: 10 }],
    total: 10 * i,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
}

function mockFetch(orders: ReturnType<typeof makeOrder>[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data: orders }),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("OrdersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockFetch([]);
    render(<OrdersPage />);
    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("shows empty state when there are no orders", async () => {
    mockFetch([]);
    render(<OrdersPage />);
    await waitFor(() =>
      expect(screen.getByText("Aucune commande pour le moment.")).toBeInTheDocument()
    );
  });

  it("renders order rows after loading", async () => {
    mockFetch([makeOrder(1), makeOrder(2)]);
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());
    expect(screen.getByText("Client 2")).toBeInTheDocument();
  });

  it("does not show pagination controls when orders fit on one page", async () => {
    mockFetch(Array.from({ length: 5 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());
    expect(screen.queryByLabelText("Page précédente")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Page suivante")).not.toBeInTheDocument();
  });

  it("shows pagination controls when orders exceed page size", async () => {
    mockFetch(Array.from({ length: 12 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());
    expect(screen.getByLabelText("Page précédente")).toBeInTheDocument();
    expect(screen.getByLabelText("Page suivante")).toBeInTheDocument();
  });

  it("shows only 10 orders on the first page", async () => {
    mockFetch(Array.from({ length: 12 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());
    expect(screen.getByText("Client 10")).toBeInTheDocument();
    expect(screen.queryByText("Client 11")).not.toBeInTheDocument();
    expect(screen.queryByText("Client 12")).not.toBeInTheDocument();
  });

  it("navigates to next page and shows remaining orders", async () => {
    mockFetch(Array.from({ length: 12 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Page suivante"));

    expect(screen.getByText("Client 11")).toBeInTheDocument();
    expect(screen.getByText("Client 12")).toBeInTheDocument();
    expect(screen.queryByText("Client 1")).not.toBeInTheDocument();
  });

  it("navigates back to previous page", async () => {
    mockFetch(Array.from({ length: 12 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Page suivante"));
    expect(screen.getByText("Client 11")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Page précédente"));
    expect(screen.getByText("Client 1")).toBeInTheDocument();
    expect(screen.queryByText("Client 11")).not.toBeInTheDocument();
  });

  it("disables previous button on first page", async () => {
    mockFetch(Array.from({ length: 12 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());
    expect(screen.getByLabelText("Page précédente")).toBeDisabled();
  });

  it("disables next button on last page", async () => {
    mockFetch(Array.from({ length: 12 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Page suivante"));
    expect(screen.getByLabelText("Page suivante")).toBeDisabled();
  });

  it("shows correct page counter", async () => {
    mockFetch(Array.from({ length: 12 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Page suivante"));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("shows correct order range label", async () => {
    mockFetch(Array.from({ length: 12 }, (_, i) => makeOrder(i + 1)));
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("1–10 sur 12 commandes")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Page suivante"));
    expect(screen.getByText("11–12 sur 12 commandes")).toBeInTheDocument();
  });

  it("resets to page 1 when new orders arrive while on page 2", async () => {
    jest.useFakeTimers();
    const initialOrders = Array.from({ length: 12 }, (_, i) => makeOrder(i + 1));
    mockFetch(initialOrders);
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Page suivante"));
    expect(screen.getByText("Client 11")).toBeInTheDocument();

    // Simulate a new order arriving on next poll
    const newOrders = [...initialOrders, makeOrder(13)];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: newOrders }),
    });

    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    jest.useRealTimers();
    // Should be back on page 1
    await waitFor(() => expect(screen.getByText("Client 1")).toBeInTheDocument());
  });

  it("shows pending status badge", async () => {
    mockFetch([makeOrder(1)]);
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("En attente")).toBeInTheDocument());
  });

  it("shows confirm button for pending orders", async () => {
    mockFetch([makeOrder(1)]);
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirmer" })).toBeInTheDocument());
  });

  it("updates status when confirm button is clicked", async () => {
    mockFetch([makeOrder(1)]);
    render(<OrdersPage />);
    await waitFor(() => expect(screen.getByText("En attente")).toBeInTheDocument());

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    await waitFor(() => expect(screen.getByText("Confirmée")).toBeInTheDocument());
  });
});
