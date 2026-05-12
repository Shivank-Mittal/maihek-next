import { test, expect } from "@playwright/test";
import { TestUser } from "../constants";

// Use relative URLs so Playwright's baseURL (port 3001 for tests) is respected
const BASE = "http://localhost:3001";
const Routes = {
  HOME: `${BASE}/`,
  MENU: `${BASE}/menu`,
  CHECKOUT: `${BASE}/checkout`,
  SUCCESS: `${BASE}/success`,
};

// Above the 20 EUR delivery minimum so Stripe checkout is reachable.
const StripeCart = [
  { id: "test-dish-stripe", name: "Poulet Tikka", price: 12.5, quantity: 2, option: "" },
];

const isRealStripeConfigured =
  process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") &&
  !process.env.STRIPE_SECRET_KEY.includes("REPLACE_ME");

// ─── create-checkout-session API ─────────────────────────────────────────────

test.describe("create-checkout-session", () => {
  test("returns 400 when delivery order is below the 20 EUR minimum", async ({ request }) => {
    const res = await request.post("/api/v1/create-checkout-session", {
      data: {
        items: [{ name: "Petit plat", price: 5.0, quantity: 1 }],
        orderType: "livraison",
        customerInfo: { name: TestUser.name, phone: TestUser.phone, email: TestUser.email },
        address: { addressLine: "1 Rue Test", city: "Paris", pincode: "75001" },
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("20");
  });

  test("returns a Stripe checkout URL for a valid delivery order", async ({ request }) => {
    if (!isRealStripeConfigured) {
      test.skip(true, "Skipped: set Stripe test keys in .env.test");
      return;
    }

    const res = await request.post("/api/v1/create-checkout-session", {
      data: {
        items: StripeCart.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        orderType: "livraison",
        customerInfo: { name: TestUser.name, phone: TestUser.phone, email: TestUser.email },
        address: { addressLine: "1 Rue de la Paix", city: "Paris", pincode: "75001" },
      },
    });

    expect(res.ok()).toBeTruthy();
    const { url } = await res.json();
    expect(url).toContain("checkout.stripe.com");
  });

  test("returns a Stripe checkout URL for a takeaway order below delivery minimum", async ({
    request,
  }) => {
    if (!isRealStripeConfigured) {
      test.skip(true, "Skipped: set Stripe test keys in .env.test");
      return;
    }

    const res = await request.post("/api/v1/create-checkout-session", {
      data: {
        items: [{ name: "Petit plat", price: 5.0, quantity: 1 }],
        orderType: "emporter",
        customerInfo: { name: TestUser.name, phone: TestUser.phone, email: TestUser.email },
      },
    });

    expect(res.ok()).toBeTruthy();
    const { url } = await res.json();
    expect(url).toContain("checkout.stripe.com");
  });
});

// ─── payment-success webhook ──────────────────────────────────────────────────

test.describe("payment-success webhook", () => {
  test("rejects requests with an invalid Stripe signature", async ({ request }) => {
    const res = await request.post("/api/v1/payment-success", {
      headers: {
        "stripe-signature": "invalid_signature",
        "content-type": "application/json",
      },
      data: JSON.stringify({ type: "checkout.session.completed" }),
    });

    expect(res.status()).toBe(400);
  });
});

// ─── Full end-to-end flow (real test keys required) ───────────────────────────
//
// Covers: menu → add dishes → upsell modal (extras) → checkout form → Stripe → success page

test.describe("Full payment flow @stripe", () => {
  test.skip(!isRealStripeConfigured, "Skipped: set Stripe test keys in .env.test");

  test("menu → add dishes → extras → checkout → Stripe payment → success page", async ({ page }) => {
    test.setTimeout(120_000);

    // ── Step 1: Go to the menu ─────────────────────────────────────────────────
    await page.goto(Routes.MENU);
    await page.waitForSelector("text=Notre Menu", { timeout: 15_000 });

    // ── Step 2: Add two dishes from whatever loads first ──────────────────────
    // Wait for at least one dish card to appear
    await page.waitForSelector("button:has-text('Ajouter au panier')", { timeout: 15_000 });

    // Increment the first dish twice and add it
    const firstCard = page.locator(".bg-white.rounded-2xl").first();
    await firstCard.locator("button", { hasText: "+" }).click();
    await firstCard.locator("button", { hasText: "+" }).click();
    await firstCard.getByRole("button", { name: "Ajouter au panier" }).click();

    // Add a second dish (different card)
    const secondCard = page.locator(".bg-white.rounded-2xl").nth(1);
    await secondCard.locator("button", { hasText: "+" }).click();
    await secondCard.getByRole("button", { name: "Ajouter au panier" }).click();

    // ── Step 3: Open cart and proceed to upsell modal ─────────────────────────
    // Cart drawer opens automatically on mobile; on desktop click the checkout button
    await page.getByRole("button", { name: /passer à la commande|passer à la caisse/i }).first().click();

    // ── Step 4: Upsell modal — Step 1 (rice/bread) ────────────────────────────
    await page.waitForSelector("text=Étape 1 sur 2", { timeout: 10_000 });

    // Add one rice/bread item if available, otherwise skip to next step
    const plusButtons = page.locator("text=Étape 1 sur 2").locator("..").locator("button").filter({ hasText: "+" });
    if (await plusButtons.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
      await plusButtons.first().click();
    }

    // Go to extras step
    await page.getByRole("button", { name: /suivant.*extras/i }).click();

    // ── Step 5: Upsell modal — Step 2 (extras) ────────────────────────────────
    await page.waitForSelector("text=Étape 2 sur 2", { timeout: 5_000 });

    // Add two extras (max allowed is 2)
    const addonPlusButtons = page.locator("text=Étape 2 sur 2")
      .locator("..").locator("button").filter({ hasText: "+" });

    await addonPlusButtons.nth(0).click(); // first extra
    await addonPlusButtons.nth(1).click(); // second extra

    // Continue to checkout
    await page.getByRole("button", { name: /continuer vers le paiement/i }).click();

    // ── Step 6: Checkout page ─────────────────────────────────────────────────
    await page.waitForURL(/\/checkout/, { timeout: 10_000 });

    // Fill customer info
    await page.getByPlaceholder("Entrez votre nom").fill(TestUser.name);
    await page.getByPlaceholder("0612345678").fill(TestUser.phone);
    await page.getByPlaceholder("exemple@domaine.com").fill(TestUser.email);

    // Livraison + En ligne is the default selection but requires Google Places
    // address confirmation which can't be automated. Instead we call the API
    // directly with the cart contents and navigate to the returned Stripe URL.
    const cartItems = await page.evaluate(() => {
      const raw = localStorage.getItem("cartItems");
      return raw ? JSON.parse(raw) : [];
    });

    const sessionRes = await page.request.post("/api/v1/create-checkout-session", {
      data: {
        items: cartItems.map((i: any) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        orderType: "livraison",
        customerInfo: { name: TestUser.name, phone: TestUser.phone, email: TestUser.email },
        address: { addressLine: "1 Rue de la Paix", city: "Paris", pincode: "75001" },
      },
    });
    expect(sessionRes.ok()).toBeTruthy();
    const { url: stripeUrl } = await sessionRes.json();

    await page.goto(stripeUrl);

    // ── Step 7: Stripe hosted checkout ────────────────────────────────────────
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });
    await page.getByRole("button", { name: "Pay" }).waitFor({ state: "visible", timeout: 15_000 });

    // Fill contact fields
    await page.locator('input[placeholder="email@example.com"]').fill(TestUser.email);
    await page.locator('input[placeholder="06 12 34 56 78"]').fill(TestUser.phone);

    // Fill card fields inside Stripe iframes
    const fillInFrame = async (placeholder: string, value: string) => {
      for (const frame of page.frames()) {
        const input = frame.locator(`input[placeholder="${placeholder}"]`);
        if (await input.isVisible({ timeout: 1_000 }).catch(() => false)) {
          await input.fill(value);
          return;
        }
      }
      throw new Error(`Could not find Stripe input: ${placeholder}`);
    };

    await fillInFrame("1234 1234 1234 1234", "4242 4242 4242 4242");
    await fillInFrame("MM / YY", "12 / 30");
    await fillInFrame("CVC", "123");

    await page.locator('input[placeholder="Full name on card"]').fill(TestUser.name);

    await page.getByRole("button", { name: "Pay" }).click();

    // ── Step 8: Success page ──────────────────────────────────────────────────
    await page.waitForURL(/localhost:\d+\/success/, { timeout: 60_000 });
    await expect(page).toHaveURL(/\/success/);
    await expect(page.getByText(TestUser.name)).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Success page: order confirmation polling ─────────────────────────────────

test.describe("Success page", () => {
  test("shows order details after Stripe redirect (mocked DB)", async ({ page }) => {
    await page.route("**/api/v1/order-by-session**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            _id: "order-stripe-test",
            customerName: TestUser.name,
            phone: TestUser.phone,
            email: TestUser.email,
            deliveryAddress: "1 Rue de la Paix, Paris",
            orderType: "livraison",
            items: [{ name: "Poulet Tikka", price: 12.5, quantity: 2, _subtotal: 25.0 }],
            total: 25.0,
            paymentMethod: "online",
            status: "pending",
          },
        }),
      });
    });

    await page.goto(`${Routes.SUCCESS}?session_id=cs_test_mock_session`);

    await expect(page.getByText(TestUser.name)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("25.00 €").first()).toBeVisible();
  });
});
