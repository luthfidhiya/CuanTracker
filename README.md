# CuanTracker 💰

A personal finance app built with Next.js 16 that uses Google Sheets as its database. Track income, expenses, and transfers between your wallets, without setting up a database.

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

| Feature                     | Description                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| **Overview**                | Total balance (IDR and USD), this month's income, expense and net, wallets, latest transactions  |
| **Wallets**                 | Bank, e-wallet, cash and investment wallets with their own color and currency                   |
| **Multi-currency**          | IDR, USD, USDC, ETH and BTC; totals and analytics are converted to IDR with live rates          |
| **Transactions**            | Income, expense and transfers between wallets of the same currency, grouped by day with a daily net |
| **Search and filter**       | Search by category or note, filter by type, browse month by month (the month is in the URL)     |
| **Wallet detail**           | Per-wallet history where transfers read as money in or out of that wallet                       |
| **Categories**              | Income and expense categories with colors, opened from the settings menu                                 |
| **Analytics**               | Monthly trend, spending by category and by wallet, saving rate, over any date range (max 24 months) |
| **Privacy mode**            | Masks every amount and blurs charts; on by default so balances never flash on screen            |
| **Installable app**         | PWA with a bottom tab bar, a global add button and swipe between tabs on phones                 |
| **Formula-based balances**  | Wallet balances are `SUMPRODUCT` formulas in the sheet, so the spreadsheet stays correct when edited by hand |

---

## Tech Stack

| Layer              | Technology                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) (App Router, Server Components, Cache Components) |
| **UI**             | React 19, Tailwind CSS v4                                                         |
| **Icons**          | [Lucide React](https://lucide.dev/)                                               |
| **Charts**         | [Recharts](https://recharts.org/)                                                 |
| **Animations**     | [Framer Motion](https://www.framer.com/motion/)                                   |
| **Dialogs**        | [Radix UI](https://www.radix-ui.com/) and [Sonner](https://sonner.emilkowal.ski/) toasts |
| **Validation**     | [Zod](https://zod.dev/)                                                           |
| **Tests**          | [Vitest](https://vitest.dev/)                                                     |
| **Auth**           | [NextAuth.js v5](https://authjs.dev/) (Credentials provider, JWT session)         |
| **Database**       | [Google Sheets API v4](https://developers.google.com/sheets/api) via `googleapis` |
| **Date handling**  | [date-fns](https://date-fns.org/)                                                 |
| **Language**       | TypeScript                                                                        |

---

## Prerequisites

Before running this project, you need:

1. **Node.js 24** (or 22.23.4+; older releases are missing the October 2026 security fixes)
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

> **Important:** Wrap `GOOGLE_PRIVATE_KEY` in double quotes. Paste it either on one line with the `\n` escapes from the JSON file, or across several lines inside the quotes. Without the quotes only the first line is read and every request to Google fails.
>
> `.env` works too; Next.js reads both. Never commit either file.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to `/login` — use the password you set in `APP_PASSWORD`.

On the first save, the app creates the sheets it needs in your spreadsheet:

- `Wallets` — stores wallet/card records
- `Categories` — stores custom income/expense categories
- `Transactions_MMMyyy` — one sheet per month (e.g., `Transactions_Feb2026`)

### Other Commands

```bash
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm test         # Unit tests for the data logic (no Google access needed)
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

> **Category names are stored on each transaction**, so deleting or renaming a category never changes past transactions. Categories that older versions soft-deleted (named `DELETED_…`) are hidden.
>
> **Deleting a wallet** also deletes every transaction that touches it, including transfers to and from other wallets; the app shows how many before you confirm.

---

## Project Structure

```
├── app/
│   ├── (app)/                  # Signed-in pages, sharing the app shell
│   │   ├── layout.tsx          # Shell + global "add transaction" button
│   │   ├── page.tsx            # Overview
│   │   ├── transactions/       # ?month=yyyy-MM
│   │   ├── wallets/            # List and wallets/[id] detail
│   │   ├── analytics/          # ?from=&to=
│   │   ├── categories/         # Category management
│   │   └── error.tsx           # Shown when Google Sheets can't be reached
│   ├── actions/                # Server actions: auth check, validation, write lock, cache invalidation
│   ├── login/                  # Login page and action
│   └── api/auth/[...nextauth]/ # NextAuth handlers
├── components/
│   ├── shell/                  # Sidebar, bottom tabs, settings menu, swipe navigation, exit confirmation
│   ├── transactions/           # Form, grouped list, filters, add button
│   ├── wallets/                # Wallet form, list rows, edit/delete actions
│   ├── categories/             # Category manager
│   ├── analytics/              # Trend chart and breakdown lists
│   ├── ui/                     # Button, inputs, sheet, confirm dialog, amount, month nav, …
│   └── privacy.ts              # Privacy mode (stored per device)
├── lib/
│   ├── sheets/                 # Google Sheets client, layout (schema), row mappers, balance formula
│   ├── data/                   # Cached reads ("use cache" + tags) and writes per entity
│   ├── server/action.ts        # Shared wrapper for server actions
│   ├── analytics.ts            # Totals and breakdowns (pure, tested)
│   ├── validation.ts           # Zod schemas for all inputs
│   ├── money.ts, format-date.ts# Formatting for id-ID
│   └── exchange.ts             # Exchange rates via Frankfurter and CoinGecko
├── auth.ts                     # NextAuth configuration (Credentials provider, JWT)
└── proxy.ts                    # Redirects signed-out requests to /login
```

Google Sheets allows 60 read requests per minute. Reads are cached for a short time and invalidated after every change, and multi-sheet scans use a single batch request.

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
