import type { ExchangeRates } from "./exchange";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type CategoryType = "INCOME" | "EXPENSE";

export interface Wallet {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  color: string;
  currencyCode: string;
  currencySymbol: string;
}

export interface WalletWithBalance extends Wallet {
  currentBalance: number;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
}

export interface Transaction {
  id: string;
  /** "yyyy-MM-dd" */
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  walletId: string;
  toWalletId?: string;
}

export interface MonthTotals {
  /** IDR-normalized */
  income: number;
  /** IDR-normalized */
  expense: number;
}

export interface DashboardStats extends MonthTotals {
  totalBalanceIdr: number;
  totalBalanceUsd: number;
  recentTransactions: Transaction[];
  wallets: WalletWithBalance[];
  exchangeRates: ExchangeRates;
}

export interface TrendPoint extends MonthTotals {
  /** "yyyy-MM-dd" for daily trends, "yyyy-MM" for monthly ones. */
  key: string;
}

export interface Trend {
  granularity: "day" | "month";
  points: TrendPoint[];
}

export interface StatItem {
  name: string;
  value: number;
  color: string;
}

export interface DetailedStats {
  /** Every day (single-month range) or month in the range, including empty ones. */
  trend: Trend;
  totalIncome: number;
  totalExpense: number;
  expenseByCategory: StatItem[];
  incomeByCategory: StatItem[];
  expenseByWallet: StatItem[];
  incomeByWallet: StatItem[];
}
