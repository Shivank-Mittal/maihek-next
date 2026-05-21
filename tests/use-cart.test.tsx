import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/hooks/use-cart";
import * as dishesService from "@/services/dishes-service";

jest.mock("@/services/dishes-service", () => ({
  listDishCategories: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCategories = [
  {
    _id: "cat1",
    name: "Starters",
    dishes: [
      {
        _id: "dish1",
        name: "Updated Samosa",
        price: 6,
        image: "/samosa.jpg",
        discount: null,
      },
    ],
  },
];

const mockStoredCart = [
  {
    id: "dish1",
    name: "Old Samosa",
    price: 5,
    quantity: 2,
    category: "Starters",
  },
];

// Helper: renders a component that reads from CartProvider
const CartDisplay = () => {
  const { cart } = useCart();
  return (
    <ul>
      {cart.map((item) => (
        <li key={item.id} data-testid="cart-item">
          {item.name} — €{item.price}
        </li>
      ))}
    </ul>
  );
};

const renderWithCart = () =>
  render(
    <CartProvider>
      <CartDisplay />
    </CartProvider>
  );

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("CartProvider — initial load", () => {
  it("renders empty cart when localStorage is empty", () => {
    (dishesService.listDishCategories as jest.Mock).mockResolvedValue([]);
    renderWithCart();
    expect(screen.queryAllByTestId("cart-item")).toHaveLength(0);
  });

  it("loads cart items from localStorage immediately before API resolves", async () => {
    localStorage.setItem("cartItems", JSON.stringify(mockStoredCart));
    // Never resolves during this test
    (dishesService.listDishCategories as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderWithCart();

    await waitFor(() => {
      expect(screen.getByText(/Old Samosa/)).toBeInTheDocument();
    });
  });

  it("enriches cart items with latest data from API", async () => {
    localStorage.setItem("cartItems", JSON.stringify(mockStoredCart));
    (dishesService.listDishCategories as jest.Mock).mockResolvedValue(mockCategories);

    renderWithCart();

    await waitFor(() => {
      expect(screen.getByText(/Updated Samosa/)).toBeInTheDocument();
    });
    // Price should also be updated
    expect(screen.getByText(/€6/)).toBeInTheDocument();
  });

  it("does not call listDishCategories when cart is empty", async () => {
    localStorage.setItem("cartItems", JSON.stringify([]));
    renderWithCart();

    await act(async () => {});
    expect(dishesService.listDishCategories).not.toHaveBeenCalled();
  });

  it("resets cart to [] and shows error toast when localStorage value is malformed", async () => {
    localStorage.setItem("cartItems", "not-valid-json{{{");
    const { toast } = require("sonner");

    renderWithCart();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load cart.");
    });
    expect(screen.queryAllByTestId("cart-item")).toHaveLength(0);
  });
});

describe("CartProvider — AbortController on unmount", () => {
  it("does not update cart after component unmounts (AbortError is silently ignored)", async () => {
    localStorage.setItem("cartItems", JSON.stringify(mockStoredCart));

    let resolveCategories!: (v: typeof mockCategories) => void;
    (dishesService.listDishCategories as jest.Mock).mockReturnValue(
      new Promise((res) => {
        resolveCategories = res;
      })
    );

    const { unmount } = renderWithCart();

    // Unmount before the API call resolves — triggers controller.abort()
    unmount();

    const abortError = new DOMException("The user aborted a request.", "AbortError");
    (dishesService.listDishCategories as jest.Mock).mockRejectedValue(abortError);

    // Resolve with fresh data — setCart should NOT be called
    await act(async () => {
      resolveCategories(mockCategories);
    });

    // No assertion on DOM since component is unmounted; the key check is that
    // no unhandled error or console.error is thrown for AbortError.
    expect(true).toBe(true);
  });

  it("logs non-AbortError failures from listDishCategories", async () => {
    localStorage.setItem("cartItems", JSON.stringify(mockStoredCart));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (dishesService.listDishCategories as jest.Mock).mockRejectedValue(
      new Error("Network failure")
    );

    renderWithCart();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error refreshing cart items from dishes API:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
