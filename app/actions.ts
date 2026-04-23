"use server";

import {
  appendSheetData,
  getSheetData,
  initializeSheets,
  getMonthlySheetName,
  getRangeData,
  deleteTransactionById,
  updateSheetRow,
  findRowIndexById,
  deleteMultipleRowsByWalletId,
  deleteWalletById,
  deleteSheetRow,
  updateWalletFormulas,
  getSheets,
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
import { format, parseISO } from "date-fns";
import { fetchExchangeRates, convertToUsd } from "@/lib/exchange";

let initialized = false;

function parseSheetDate(value: unknown): string {
  if (!value) return "";
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }
  return String(value);
}

async function ensureInitialized() {
  if (!initialized) {
    await initializeSheets();
    initialized = true;
  }
}

export async function getWallets(): Promise<
  (Wallet & { currentBalance: number })[]
> {
  await ensureInitialized();
  const data = await getSheetData("Wallets!A2:H");
  if (!data || data.length === 0) return [];

  return data.map((row: string[]) => {
    const initialBalance = parseFloat(String(row[3] || "0"));
    const currencyCode = row[5] || "IDR";
    const currencySymbol = row[6] || "Rp";
    const currentBalance =
      parseFloat(String(row[7] || "0")) || parseFloat(String(row[3] || "0"));
    return {
      id: String(row[0]),
      name: String(row[1]),
      type: String(row[2]),
      initialBalance,
      color: String(row[4]),
      currencyCode: String(currencyCode),
      currencySymbol: String(currencySymbol),
      currentBalance,
    };
  });
}

export async function getCategories(): Promise<Category[]> {
  await ensureInitialized();
  const data = await getSheetData("Categories!A2:D");
  if (!data || data.length === 0) return [];

  return data.map((row: unknown[]) => ({
    id: String(row[0]),
    name: String(row[1]),
    type: String(row[2]) as CategoryType,
    color: String(row[3]),
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
    .map((row: unknown[]) => ({
      id: String(row[0]),
      date: parseSheetDate(row[1]),
      amount: parseFloat(String(row[2] || "0")),
      type: String(row[3]) as TransactionType,
      category: String(row[4]),
      description: String(row[5]),
      walletId: String(row[6]),
      toWalletId: row[7] ? String(row[7]) : undefined,
    }))
    .reverse();
}

export async function getExchangeRates() {
  return fetchExchangeRates();
}

export async function addWallet(data: Omit<Wallet, "id">) {
  await ensureInitialized();
  const id = crypto.randomUUID();
  const row: (string | number)[] = [
    id,
    data.name,
    data.type,
    data.initialBalance,
    data.color,
    data.currencyCode || "IDR",
    data.currencySymbol || "Rp",
  ];
  await appendSheetData("Wallets!A:H", row);
  await updateWalletFormulas();
  return { success: true };
}

export async function editWallet(
  id: string,
  data: { name: string; type: string; color: string }
) {
  await ensureInitialized();
  const rowIndex = await findRowIndexById("Wallets", id);
  if (!rowIndex) throw new Error("Wallet not found");

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  // Update name and type (Columns B and C)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Wallets!B${rowIndex}:C${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[data.name, data.type]] },
  });

  // Update color (Column E)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Wallets!E${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[data.color]] },
  });

  return { success: true };
}

export async function addCategory(data: Omit<Category, "id">) {
  await ensureInitialized();
  const id = crypto.randomUUID();
  const row = [id, data.name, data.type, data.color];
  await appendSheetData("Categories!A:D", row);
  return { success: true };
}

export async function editCategory(
  id: string,
  data: { name: string; type: string; color: string }
) {
  await ensureInitialized();
  const rowIndex = await findRowIndexById("Categories", id);
  if (!rowIndex) throw new Error("Category not found");

  const sheets = await getSheets();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Categories!B${rowIndex}:D${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[data.name, data.type, data.color]] },
  });

  return { success: true };
}

export async function deleteCategory(id: string) {
  await ensureInitialized();
  const rowIndex = await findRowIndexById("Categories", id);
  if (!rowIndex) throw new Error("Category not found");

  await deleteSheetRow("Categories", rowIndex);
  return { success: true };
}

export async function addTransaction(data: Omit<Transaction, "id">) {
  await ensureInitialized();
  const id = crypto.randomUUID();
  const sheetName = getMonthlySheetName(new Date(data.date));
  const row: (string | number)[] = [
    id,
    data.date,
    data.amount,
    data.type,
    data.category,
    data.description,
    data.walletId,
    data.toWalletId || "",
  ];
  const TRANSACTION_HEADERS = [
    "ID",
    "Date",
    "Amount",
    "Type",
    "Category",
    "Description",
    "WalletId",
    "ToWalletId",
  ];
  const { createSheetIfNotExists } = await import("@/lib/google");
  const created = await createSheetIfNotExists(sheetName, TRANSACTION_HEADERS);
  if (created) {
    await updateWalletFormulas();
  }

  await appendSheetData(`${sheetName}!A:H`, row);
  return { success: true };
}

export async function editTransaction(
  id: string,
  originalDate: string,
  data: Partial<Transaction>
) {
  await ensureInitialized();

  const sheetName = getMonthlySheetName(new Date(originalDate));
  const rowIndex = await findRowIndexById(sheetName, id);

  if (!rowIndex) {
    throw new Error("Transaction not found");
  }

  const row: (string | number)[] = [
    id,
    data.date || originalDate,
    data.amount ?? 0,
    data.type || "EXPENSE",
    data.category || "",
    data.description || "",
    data.walletId || "",
    data.toWalletId || "",
  ];

  // Update specific row A{rowIndex}:H{rowIndex}
  await updateSheetRow(`${sheetName}!A${rowIndex}:H${rowIndex}`, row);
  return { success: true };
}

export async function deleteTransaction(id: string, date: string) {
  await ensureInitialized();
  try {
    await deleteTransactionById(id, date);
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, error: "Failed" };
  }
}

export async function deleteWallet(id: string) {
  await ensureInitialized();
  try {
    await deleteMultipleRowsByWalletId(id);
    await deleteWalletById(id);
    return { success: true };
  } catch (error) {
    console.error("Delete wallet failed:", error);
    return { success: false, error: "Failed" };
  }
}

export async function getDashboardData(): Promise<DashboardStats> {
  await ensureInitialized();
  const walletsWithBalance = await getWallets();

  const currentMonthTransactions = await getTransactions();

  const exchangeRates = await fetchExchangeRates();

  const walletMap = new Map(walletsWithBalance.map((w) => [w.id, w]));

  const incomeThisMonth = currentMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => {
      const wallet = walletMap.get(t.walletId);
      const amountUsd = convertToUsd(
        t.amount,
        wallet?.currencyCode || "IDR",
        exchangeRates
      );
      return s + amountUsd * exchangeRates.usdToIdr;
    }, 0);
  const expenseThisMonth = currentMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => {
      const wallet = walletMap.get(t.walletId);
      const amountUsd = convertToUsd(
        t.amount,
        wallet?.currencyCode || "IDR",
        exchangeRates
      );
      return s + amountUsd * exchangeRates.usdToIdr;
    }, 0);

  const recentTransactions = currentMonthTransactions.slice(0, 10);

  let totalBalanceUsd = 0;
  for (const wallet of walletsWithBalance) {
    const usdValue = convertToUsd(
      wallet.currentBalance,
      wallet.currencyCode,
      exchangeRates
    );
    totalBalanceUsd += usdValue;
  }
  const totalBalanceIdr = totalBalanceUsd * exchangeRates.usdToIdr;

  const categories = await getCategories();

  return {
    totalBalanceIdr,
    totalBalanceUsd,
    incomeThisMonth,
    expenseThisMonth,
    recentTransactions,
    wallets: walletsWithBalance,
    categories,
    exchangeRates,
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
  const exchangeRates = await fetchExchangeRates();

  const trends: Map<string, { income: number; expense: number }> = new Map();
  const expenseByCategory: Map<string, number> = new Map();
  const expenseByWallet: Map<string, number> = new Map();
  const incomeByWallet: Map<string, number> = new Map();

  let totalIncome = 0;
  let totalExpense = 0;

  rawData.forEach((row: unknown[]) => {
    const dateStr = parseSheetDate(row[1]);
    if (!dateStr) return;

    const date = parseISO(dateStr);
    // Filter by exact date range
    if (date < start || date > end) return;

    const monthKey = format(date, "MMM yyyy");
    const type = String(row[3]);
    const category = String(row[4]);
    const amountRaw = parseFloat(String(row[2] || "0"));
    const walletId = String(row[6]);

    // Convert amount to IDR
    const wallet = walletMap.get(walletId);
    const amountUsd = convertToUsd(
      amountRaw,
      wallet?.currencyCode || "IDR",
      exchangeRates
    );
    const amount = amountUsd * exchangeRates.usdToIdr;

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
