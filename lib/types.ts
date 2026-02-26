export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type CategoryType = "INCOME" | "EXPENSE";

export interface Wallet {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  walletId: string;
  toWalletId?: string;
}

export interface DashboardStats {
  totalBalance: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  recentTransactions: Transaction[];
  wallets: (Wallet & { currentBalance: number })[];
  categories: Category[];
}

export interface MonthlyTrend {
  month: string; // e.g., "Dec 2024"
  income: number;
  expense: number;
}

export interface StatItem {
  name: string;
  value: number;
  color?: string;
}

export interface DetailedStats {
  monthlyTrends: MonthlyTrend[];
  totalIncome: number;
  totalExpense: number;
  expenseByCategory: StatItem[];
  expenseByWallet: StatItem[];
  incomeByWallet: StatItem[];
}
