# Maihak - French-Indian Restaurant Application

Maihak is a modern, full-stack web application for a French-Indian restaurant. Built with Next.js 15, it provides a seamless experience for customers to browse the menu, make reservations, and order online, while offering a comprehensive dashboard for administrators to manage restaurant operations.

## 🚀 Key Features

### Public-Facing

- **Modern Landing Page:** A fast, responsive landing page showcasing the restaurant's unique blend of French and Indian cuisine.
- **Interactive Menu:** Browse dishes by category with support for varied options like sizes, variations, and inclusions.
- **Smart Shopping Cart:** Persistent cart management allowing users to customize their orders before checkout.
- **Table Reservation:** A simple, integrated form for booking tables.
- **Secure Checkout:** Full integration with Stripe for safe and reliable online payments.
- **Contact & Support:** Built-in contact form with automatic email notifications.

### Admin Dashboard

- **Menu Management:** Complete CRUD operations for dishes and categories, including image management and pricing options.
- **Reservation Tracking:** Monitor and manage incoming table bookings with status updates.
- **Analytics & Settings:** (In progress) Dashboard overview and restaurant configuration settings.
- **Secure Authentication:** Protected admin panel using NextAuth.js.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Payments:** [Stripe](https://stripe.com/)
- **Email:** [Nodemailer](https://nodemailer.com/)
- **State Management:** React Context + Hooks
- **UI Components:** [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Tabler Icons](https://tabler.io/icons)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## 📂 Project Structure

```text
├── public/              # Static assets and legacy HTML rewrites
├── src/
│   ├── app/             # Next.js App Router (Pages & API)
│   │   ├── (web)/       # Public-facing routes (menu, checkout, etc.)
│   │   ├── api/v1/      # RESTful API endpoints
│   │   └── dashboard/   # Admin management panel
│   ├── components/      # Reusable UI and application components
│   ├── hooks/           # Custom React hooks (cart, restaurant status)
│   ├── lib/             # Core utilities (db connection, response helpers)
│   ├── models/          # Mongoose schemas (Dish, Category, User, Settings)
│   ├── services/        # Business logic and external service integrations
│   └── types/           # TypeScript definitions
└── types/               # Shared repository types
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- MongoDB instance (local or Atlas)
- Stripe account (for API keys)
- SMTP server (for email notifications)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/maihak.git
   cd maihak
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add the following:

   ```env
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NEXTAUTH_SECRET=your_nextauth_secret

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Nodemailer
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_pass
   ```

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🛡️ Architecture & Standards

- **API Design:** All API responses follow a consistent shape: `{ success: boolean, data?: any, error?: string }`.
- **Database:** Uses a Mongoose singleton pattern for efficient connection pooling in serverless environments.
- **Middleware:** Implements rewrites for the landing page and protection for dashboard routes.
- **Type Safety:** Heavily utilizes TypeScript for end-to-end type safety across the application.

## 📝 Scripts

- `npm run dev`: Starts the development server with Turbopack.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to find and fix code issues.
- `npm run format`: Formats code using Prettier.

## 🤖 AI Development

This project includes a `CLAUDE.md` file which provides specific guidance, commands, and architectural context for developers using Claude Code. Please refer to it for consistent development practices.

## 📄 License

This project is private and intended for internal use only.
