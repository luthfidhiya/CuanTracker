"use server";

import {
  appendSheetData,
  getSheetData,
  initializeSheets,
  getMonthlySheetName,
  getRangeData,
  getAllTransactionSheetData,
  deleteTransactionById,
  updateSheetRow,
  findRowIndexById,
} from "@/lib/google";
import {
  Transaction,
  Wallet,
  DashboardStats,
  DetailedStats,
  TransactionType,
  Category,
  CategoryType,
} from "@/lib/types";
import { revalidatePath } from "next/cache";
import { format, parseISO } from "date-fns";

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeSheets();
    initialized = true;
  }
}

export async function getWallets(): Promise<Wallet[]> {
  await ensureInitialized();
  const data = await getSheetData("Wallets!A2:E");
  if (!data || data.length === 0) return [];

  return data.map((row: string[]) => ({
    id: row[0],
    name: row[1],
    type: row[2],
    initialBalance: parseFloat(row[3] || "0"),
    color: row[4],
  }));
}

export async function getCategories(): Promise<Category[]> {
  await ensureInitialized();
  const data = await getSheetData("Categories!A2:D");
  if (!data || data.length === 0) return [];

  return data.map((row: string[]) => ({
    id: row[0],
    name: row[1],
    type: row[2] as CategoryType,
    color: row[3],
  }));
}

export async function getTransactions(
  monthDate?: Date
): Promise<Transaction[]> {
  await ensureInitialized();
  const date = monthDate || new Date();
  const sheetName = getMonthlySheetName(date);
  const data = await getSheetData(`${sheetName}!A2:H`);
  if (!data || data.length === 0) return [];

  return data
    .map((row: string[]) => ({
      id: row[0],
      date: row[1],
      amount: parseFloat(row[2] || "0"),
      type: row[3] as TransactionType,
      category: row[4],
      description: row[5],
      walletId: row[6],
      toWalletId: row[7],
    }))
    .reverse();
}

export async function addWallet(data: Omit<Wallet, "id">) {
  await ensureInitialized();
  const id = crypto.randomUUID();
  const row = [
    id,
    data.name,
    data.type,
    data.initialBalance.toString(),
    data.color,
  ];
  await appendSheetData("Wallets!A:E", row);
  revalidatePath("/");
  return { success: true };
}

export async function addCategory(data: Omit<Category, "id">) {
  await ensureInitialized();
  const id = crypto.randomUUID();
  const row = [id, data.name, data.type, data.color];
  await appendSheetData("Categories!A:D", row);
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await ensureInitialized();
  const rowIndex = await findRowIndexById("Categories", id);
  if (!rowIndex) throw new Error("Category not found");

  // Note: similar to wallets we aren't literally deleting rows to avoid empty row issues for simple apps,
  // we would normally just clear the row or use sheets batchUpdate to deleteDimension.
  const row = [id, "DELETED_" + Date.now(), "EXPENSE", "#000000"];
  await updateSheetRow(`Categories!A${rowIndex}:D${rowIndex}`, row);
  revalidatePath("/");
  return { success: true };
}

export async function addTransaction(data: Omit<Transaction, "id">) {
  await ensureInitialized();
  const id = crypto.randomUUID();
  const sheetName = getMonthlySheetName(new Date(data.date));
  const row = [
    id,
    data.date,
    data.amount.toString(),
    data.type,
    data.category,
    data.description,
    data.walletId,
    data.toWalletId || "",
  ];
  await appendSheetData(`${sheetName}!A:H`, row);
  revalidatePath("/");
  return { success: true };
}

export async function editTransaction(
  id: string,
  originalDate: string,
  data: Partial<Transaction>
) {
  await ensureInitialized();

  // Note: Only supporting edits within the same month for now to avoid moving sheets complexity
  const sheetName = getMonthlySheetName(new Date(originalDate));
  const rowIndex = await findRowIndexById(sheetName, id);

  if (!rowIndex) {
    throw new Error("Transaction not found");
  }

  const row = [
    id,
    data.date || originalDate,
    data.amount?.toString() || "0",
    data.type || "EXPENSE",
    data.category || "",
    data.description || "",
    data.walletId || "",
    data.toWalletId || "",
  ];

  // Update specific row A{rowIndex}:H{rowIndex}
  await updateSheetRow(`${sheetName}!A${rowIndex}:H${rowIndex}`, row);
  revalidatePath("/");
  return { success: true };
}

export async function deleteTransaction(id: string, date: string) {
  await ensureInitialized();
  try {
    await deleteTransactionById(id, date);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, error: "Failed" };
  }
}

export async function getDashboardData(): Promise<DashboardStats> {
  const wallets = await getWallets();

  // --- 1. Fetch ALL transactions from every month sheet for accurate balances ---
  const allRawRows = await getAllTransactionSheetData();

  const walletBalances = new Map<string, number>();
  wallets.forEach((w) => walletBalances.set(w.id, w.initialBalance));

  allRawRows.forEach((row: string[]) => {
    const type = row[3];
    const amount = parseFloat(row[2] || "0");
    const walletId = row[6];
    const toWalletId = row[7];

    if (type === "INCOME") {
      walletBalances.set(
        walletId,
        (walletBalances.get(walletId) || 0) + amount
      );
    } else if (type === "EXPENSE") {
      walletBalances.set(
        walletId,
        (walletBalances.get(walletId) || 0) - amount
      );
    } else if (type === "TRANSFER" && toWalletId) {
      walletBalances.set(
        walletId,
        (walletBalances.get(walletId) || 0) - amount
      );
      walletBalances.set(
        toWalletId,
        (walletBalances.get(toWalletId) || 0) + amount
      );
    }
  });

  const totalBalance = Array.from(walletBalances.values()).reduce(
    (a, b) => a + b,
    0
  );

  // --- 2. Fetch CURRENT MONTH transactions for this-month stats & recent list ---
  const currentMonthTransactions = await getTransactions();

  const incomeThisMonth = currentMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const expenseThisMonth = currentMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);

  const categories = await getCategories();

  return {
    totalBalance,
    incomeThisMonth,
    expenseThisMonth,
    recentTransactions: currentMonthTransactions.slice(0, 10),
    wallets: wallets.map((w) => ({
      ...w,
      currentBalance: walletBalances.get(w.id) || 0,
    })),
    categories,
  };
}

export async function getMonitoringData(
  startDate: string,
  endDate: string
): Promise<DetailedStats> {
  await ensureInitialized();
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const rawData = await getRangeData(start, end);
  const wallets = await getWallets();
  const walletMap = new Map(wallets.map((w) => [w.id, w]));

  const trends: Map<string, { income: number; expense: number }> = new Map();
  const expenseByCategory: Map<string, number> = new Map();
  const expenseByWallet: Map<string, number> = new Map();
  const incomeByWallet: Map<string, number> = new Map();

  let totalIncome = 0;
  let totalExpense = 0;

  rawData.forEach((row: string[]) => {
    const dateStr = row[1];
    if (!dateStr) return;

    const date = parseISO(dateStr);
    const monthKey = format(date, "MMM yyyy");
    const type = row[3];
    const category = row[4];
    const amount = parseFloat(row[2] || "0");
    const walletId = row[6];

    // Monthly Trends
    if (!trends.has(monthKey)) trends.set(monthKey, { income: 0, expense: 0 });
    const current = trends.get(monthKey)!;

    if (type === "INCOME") {
      current.income += amount;
      totalIncome += amount;
      incomeByWallet.set(
        walletId,
        (incomeByWallet.get(walletId) || 0) + amount
      );
    }
    if (type === "EXPENSE") {
      current.expense += amount;
      totalExpense += amount;
      expenseByWallet.set(
        walletId,
        (expenseByWallet.get(walletId) || 0) + amount
      );
      const catName = category || "Uncategorized";
      expenseByCategory.set(
        catName,
        (expenseByCategory.get(catName) || 0) + amount
      );
    }
  });

  const monthlyTrends = Array.from(trends.entries())
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const toStatArray = (map: Map<string, number>, resolveName?: boolean) => {
    const arr = Array.from(map.entries()).map(([key, val]) => ({
      name: resolveName ? walletMap.get(key)?.name || "Unknown" : key,
      value: val,
      color: resolveName ? walletMap.get(key)?.color : undefined,
    }));
    return arr.sort((a, b) => b.value - a.value);
  };

  const PALETTE = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#06b6d4",
    "#6366f1",
    "#ec4899",
    "#8b5cf6",
  ];

  return {
    monthlyTrends,
    totalIncome,
    totalExpense,
    expenseByCategory: toStatArray(expenseByCategory).map((item, i) => ({
      ...item,
      color: PALETTE[i % PALETTE.length],
    })),
    expenseByWallet: toStatArray(expenseByWallet, true),
    incomeByWallet: toStatArray(incomeByWallet, true),
  };
}
