# CuanTracker 💰

A **premium personal finance management app** built with Next.js 16 and Google Sheets as the database. Track your income, expenses, and inter-wallet transfers with a stunning glassmorphism dark-mode UI — no traditional database setup required.

> **Goal:** This project is built specifically for **personal financial monitoring** — helping individuals understand where their money comes from, where it goes, and how their wealth changes over time across multiple wallets and accounts.

---

## Why Google Sheets as a Database?

Most personal finance apps require a backend database (PostgreSQL, MySQL, etc.), which adds hosting complexity and cost. CuanTracker takes a different approach:

- **Zero database cost** — Google Sheets is free for personal use
- **Human-readable data** — open your spreadsheet anytime and inspect/edit data directly
- **No migrations** — schema changes are just new columns in a sheet
- **Built-in backup** — Google automatically versions your spreadsheet
- **Easy sharing** — share your spreadsheet with a partner or accountant with a single link
- **No vendor lock-in** — export to CSV anytime

The tradeoff is that it is best suited for personal/small-scale use (not thousands of concurrent users), which is exactly the target audience.

---

## Features

| Feature                               | Description                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 📊 **Dashboard Overview**             | Total balance, this-month income vs expense, and a quick bar chart summary                                               |
| 💳 **Wallet / Card Management**       | Create, edit, and manage multiple wallets (Bank, E-Wallet, Cash, Investment) with custom colors                          |
| 🌍 **Multi-Currency Support**         | Support for multiple currencies including fiat (IDR, USD) and crypto (BTC, ETH, USDC)                                    |
| 💱 **Live Crypto Rates**              | Real-time exchange rates for crypto assets relative to USD on the dashboard                                              |
| 🔍 **Per-Wallet Transaction History** | Click any wallet card to see transactions filtered to that wallet                                                        |
| 📋 **Global Transaction Log**         | Full history across all wallets with month navigation, type filtering, and wallet source badges                          |
| ➕ **Income / Expense / Transfer**    | Log all three transaction types; transfers move money between your own wallets                                           |
| 🏷️ **Category Management**            | Define and edit custom Income and Expense categories; soft-delete preserves historical labels                            |
| 🔎 **Search & Filter**                | Search by category or note; filter by All / Income / Expense / Transfer                                                  |
| ✏️ **Edit & Delete**                  | Inline edit and delete for every transaction, category, and wallet                                                       |
| 📈 **Analytics Tab**                  | Area chart for cash-flow trends, pie charts for spend-by-category, spend-by-wallet, income-by-wallet over any date range |
| 🧮 **IDR-Normalized Charts**          | All foreign currency transactions are converted to IDR automatically for accurate financial aggregations in charts       |
| 🌙 **Premium Dark UI**                | Neon aurora background, glassmorphism cards, smooth animations, fully responsive                                         |
| 📱 **Swipeable Mobile Navigation**    | Horizontal swipeable carousel for mobile devices with auto-scrolling active tabs and a sticky glassmorphic top header    |
| 🔗 **Deep-Link Navigation**           | Seamless navigation between components (e.g. clicking a wallet navigates to activity view, clicking chart to analytics)  |
| 🤫 **Privacy Mode**                   | One-click toggle to blur out all sensitive amounts                                                                       |
| ⚡ **Lazy Per-Menu Fetching**         | Pages dynamically load only what they need when active, minimizing API calls and maximizing speed                        |
| 🧮 **Formula-Based Balances**         | Wallet balances are dynamically calculated purely using Google Sheets SUMPRODUCT formulas automatically injected on init |

---

## Tech Stack

| Layer              | Technology                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) (App Router, React Server Components)           |
| **UI**             | React 19, Tailwind CSS v4                                                         |
| **Icons**          | [Lucide React](https://lucide.dev/)                                               |
| **Charts**         | [Recharts](https://recharts.org/)                                                 |
| **Animations**     | [Framer Motion](https://www.framer.com/motion/)                                   |
| **Dialogs / Tabs** | [Radix UI](https://www.radix-ui.com/)                                             |
| **Auth**           | [NextAuth.js v5](https://authjs.dev/) (Credentials provider, JWT session)         |
| **Database**       | [Google Sheets API v4](https://developers.google.com/sheets/api) via `googleapis` |
| **Date handling**  | [date-fns](https://date-fns.org/)                                                 |
| **Language**       | TypeScript                                                                        |

---

## Prerequisites

Before running this project, you need:

1. A **Google Account**
2. A **Google Cloud project** with the Sheets API enabled
3. A **Service Account** with access to your spreadsheet
4. A **Google Spreadsheet** (empty — the app creates sheets automatically)

---

## Configuration

### Step 1 — Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Enable APIs** and enable **Google Sheets API**
4. Navigate to **APIs & Services → Credentials**
5. Click **Create Credentials → Service Account**
6. Give it any name, then click **Done**
7. Click the newly created service account, go to the **Keys** tab
8. Click **Add Key → Create new key → JSON**
9. A `.json` file will be downloaded — keep it safe

### Step 2 — Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/) and create a new blank spreadsheet
2. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```
3. Share the spreadsheet with your Service Account email (found in the JSON file as `client_email`) — give it **Editor** access

### Step 3 — Configure Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

Then open `.env.local` and replace the placeholder values:

```env
# Google Service Account credentials
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END RSA PRIVATE KEY-----\n"

# Google Spreadsheet ID
SPREADSHEET_ID=your_spreadsheet_id_here

# App password for login (used by NextAuth)
APP_PASSWORD=your_secure_password_here

# NextAuth secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your_auth_secret_here
```

> **Important:** Copy the `private_key` value from the downloaded JSON file exactly as-is, keeping the `\n` escape sequences intact and wrapping the entire value in double quotes.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to `/login` — use the password you set in `APP_PASSWORD`.

On first load, the app automatically creates the required sheets in your spreadsheet:

- `Wallets` — stores wallet/card records
- `Categories` — stores custom income/expense categories
- `Transactions_MMMyyy` — one sheet per month (e.g., `Transactions_Feb2026`)

### Other Commands

```bash
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Google Sheets Data Structure

### `Wallets` sheet

| Column | Field          | Example                                     |
| ------ | -------------- | ------------------------------------------- |
| A      | ID             | `uuid-v4`                                   |
| B      | Name           | `BCA Savings`                               |
| C      | Type           | `Bank` / `E-Wallet` / `Cash` / `Investment` |
| D      | InitialBalance | `5000000`                                   |
| E      | Color          | `#3b82f6`                                   |
| F      | CurrencyCode   | `IDR` / `USD` / `BTC` / `ETH` / `USDC`      |
| G      | CurrencySymbol | `Rp` / `$` / `₿` / `Ξ`                      |
| H      | CurrentBalance | `=D2 + SUMPRODUCT(...)` (Auto-generated)    |

### `Categories` sheet

| Column | Field | Example              |
| ------ | ----- | -------------------- |
| A      | ID    | `uuid-v4`            |
| B      | Name  | `Food & Drink`       |
| C      | Type  | `INCOME` / `EXPENSE` |
| D      | Color | `#22c55e`            |

### `Transactions_MMMyyy` sheets (one per month)

| Column | Field       | Example                           |
| ------ | ----------- | --------------------------------- |
| A      | ID          | `uuid-v4`                         |
| B      | Date        | `2026-02-15`                      |
| C      | Amount      | `50000`                           |
| D      | Type        | `INCOME` / `EXPENSE` / `TRANSFER` |
| E      | Category    | `Food & Drink`                    |
| F      | Description | `Lunch at warung`                 |
| G      | WalletId    | `uuid-v4`                         |
| H      | ToWalletId  | `uuid-v4` (only for TRANSFER)     |

> **Soft Delete for Categories:** Deleting a category marks its name as `DELETED_<timestamp>` rather than removing the row, preserving the integrity of existing transaction labels.

---

## Project Structure

```
├── app/
│   ├── actions.ts              # All server actions (CRUD for wallets, transactions, categories)
│   ├── layout.tsx              # Root layout with metadata and font
│   ├── page.tsx                # Entry point — providers wrapper and AppShell container
│   ├── login/
│   │   ├── page.tsx            # Login page
│   │   └── actions.ts          # Login server action (NextAuth signIn)
│   └── api/auth/[...nextauth]/ # NextAuth HTTP handlers (GET/POST)
│       └── route.ts
├── components/
│   ├── AppShell.tsx            # Main layout: desktop sidebar, mobile sticky header + horizontal tabs, FAB
│   ├── Dashboard.tsx           # Overview: balance card + bar chart + horizontal wallet scroller (mobile)
│   ├── WalletList.tsx          # Wallet grid + per-wallet transaction detail view
│   ├── TransactionList.tsx     # Global transaction history with search/filter
│   ├── TransactionForm.tsx     # Shared form for add/edit transactions
│   ├── CategoryList.tsx        # Category management UI with soft-delete support
│   ├── Monitoring.tsx          # Analytics: area chart + pie charts
│   ├── PrivacyContext.tsx      # React Context for global show/hide amounts state
│   ├── RefreshContext.tsx      # React Context to trigger lazy re-fetching across tabs
│   └── ui/
│       ├── glass-card.tsx      # Reusable glassmorphism card component
│       ├── button.tsx          # Styled button
│       ├── input.tsx           # Styled input
│       └── confirm-dialog.tsx  # Reusable confirmation dialog
├── lib/
│   ├── google.ts               # Google Sheets API client, dynamic formula injector, and CRUD helpers
│   ├── types.ts                # All TypeScript interfaces
│   ├── currencies.ts           # Supported currencies and formatters (fiat and crypto)
│   ├── exchange.ts             # Live exchange rate fetchers via Frankfurter and CoinGecko
│   └── utils.ts                # cn() utility for class merging
├── auth.ts                     # NextAuth configuration (Credentials provider, JWT, route guards)
└── .env.local                  # Environment variables (not committed to git)
```

---

## Deployment

### Vercel (Recommended)

1. Push your repository to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add all environment variables in **Project Settings → Environment Variables**:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `SPREADSHEET_ID`
   - `APP_PASSWORD`
   - `AUTH_SECRET`
4. Deploy — Vercel handles the Next.js build automatically

### Self-hosted

```bash
npm run build
npm run start
```

Make sure all environment variables are set in your server environment.

---

## License

MIT — feel free to fork and adapt for your own personal finance needs.
