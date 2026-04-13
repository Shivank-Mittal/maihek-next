# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with Turbopack at localhost:3000
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier (write)
npm run format:check  # Prettier (check only)
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:

- `MONGODB_URL` — MongoDB connection string
- `JWT_SECRET` — used for signing access tokens (1h expiry)
- `NEXTAUTH_SECRET` — NextAuth session secret
- Stripe keys (for checkout session and payment success routes)
- Nodemailer config (for contact/send-email routes)

## Architecture

This is a **Next.js 15 App Router** project for a French-Indian restaurant (Maihak). The app has two main surfaces:

### Public-facing (`src/app/(web)/`)

- `/` — landing page (served via middleware rewrite to `/index.html` in `public/`)
- `/menu` — browse dishes by category; cart is managed via `CartProvider`
- `/checkout` — order form wired to Stripe
- `/reservation` — table reservation form
- `/contact` — contact form
- `/success`, `/cancel` — Stripe redirect pages
- `/login` — admin login (NextAuth credentials provider)
- `/dashboard` — admin panel (dishes, categories, reservations, settings) protected by session

### API (`src/app/api/v1/`)

All routes use `ApiResponse` helper from `src/lib/response.ts` for consistent shaped responses (`{ success, data }` or `{ success, error }`). DB access always goes through `connectDB()` from `src/lib/db.ts` (Mongoose singleton).

- `dishes/` — CRUD for dishes (GET list, POST create, PUT/DELETE by `[id]`)
- `category/` — CRUD for menu categories
- `reservation/` — create and list reservations
- `reservation-status/` — update reservation status
- `create-checkout-session/` — Stripe checkout session creation
- `payment-success/` — Stripe webhook/redirect handler
- `contact/` + `send-email/` — contact form and order confirmation emails via Nodemailer

### Auth

`src/app/api/auth/[...nextauth]/route.ts` uses a **hardcoded in-memory user** (single admin account). JWT access token is attached to the NextAuth session and forwarded on API calls that require auth. Role is always `"admin"`.

### Data Models (`src/models/`)

Mongoose schemas: `Dish`, `Category`, `User`, `Settings`. Dishes reference Category by ObjectId. Dishes have optional `sizes` (array of `{ size, price }`), `variations` (strings), and `includes` (strings).

### Cart State

`src/hooks/use-cart.tsx` exports `CartProvider` and `useCart`. Cart state lives in React context + `localStorage`. Cart items are keyed by `id + option` to support size/variation variants.

### UI Components

- `src/components/ui/` — shadcn/ui primitives (Radix-based)
- `src/components/` — app-level components: sidebar, cart drawer, data table, charts
- Styling: Tailwind CSS v4, `cn()` utility from `src/lib/utils.ts`, `tw-animate-css` for animations
- Icons: `@tabler/icons-react` and `lucide-react`
- Toast notifications: `sonner`
- Drag-and-drop: `@dnd-kit`
- Tables: `@tanstack/react-table`
- Charts: `recharts`
