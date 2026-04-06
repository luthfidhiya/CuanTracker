import { google, sheets_v4 } from "googleapis";
import { format, eachMonthOfInterval } from "date-fns";

let sheetsClient: sheets_v4.Sheets | null = null;
const sheetsInitialized: Set<string> = new Set();
let initPromise: Promise<void> | null = null;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

export async function getSheets() {
  if (sheetsClient) return sheetsClient;

  if (
    !process.env.GOOGLE_CLIENT_EMAIL ||
    !process.env.GOOGLE_PRIVATE_KEY ||
    !process.env.SPREADSHEET_ID
  ) {
    throw new Error("❌ Missing .env.local credentials");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sheetsClient = google.sheets({ version: "v4", auth: client as any });
  return sheetsClient;
}

export function getMonthlySheetName(date: Date = new Date()) {
  return `Transactions_${format(date, "MMMyyy")}`;
}

async function createSheetIfNotExists(sheetName: string, headers: string[]) {
  if (sheetsInitialized.has(sheetName)) return;

  const sheets = await getSheets();

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const existingSheets =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spreadsheet.data.sheets?.map((s: any) => s.properties?.title) || [];

  if (existingSheets.includes(sheetName)) {
    sheetsInitialized.add(sheetName);
    return;
  }

  console.log(`📄 Creating sheet: ${sheetName}`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });

  sheetsInitialized.add(sheetName);
}

export async function initializeSheets() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await createSheetIfNotExists("Wallets", [
        "ID",
        "Name",
        "Type",
        "InitialBalance",
        "Color",
      ]);
      await createSheetIfNotExists("Categories", [
        "ID",
        "Name",
        "Type",
        "Color",
      ]);
      const currentMonthSheet = getMonthlySheetName();
      await createSheetIfNotExists(currentMonthSheet, [
        "ID",
        "Date",
        "Amount",
        "Type",
        "Category",
        "Description",
        "WalletId",
        "ToWalletId",
      ]);
    } catch (error: unknown) {
      console.error(
        "❌ Init error:",
        error instanceof Error ? error.message : error
      );
    }
  })();

  return initPromise;
}

export async function getSheetData(range: string) {
  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    return response.data.values || [];
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("Unable to parse range")
    ) {
      return [];
    }
    return [];
  }
}

export async function appendSheetData(range: string, values: string[]) {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  return response.data;
}

// ----------------------------------------------------------------------
// Helpers for Edit/Delete
// ----------------------------------------------------------------------

export async function findRowIndexById(
  sheetName: string,
  id: string
): Promise<number | null> {
  const data = await getSheetData(`${sheetName}!A:A`);
  if (!data) return null;

  const index = data.findIndex((row: string[]) => row[0] === id);

  if (index === -1) return null;
  return index + 1;
}

export async function updateSheetRow(range: string, values: string[]) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function deleteSheetRow(sheetName: string, rowIndex: number) {
  const sheets = await getSheets();

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );

  if (!sheet?.properties?.sheetId)
    throw new Error(`Sheet ${sheetName} not found`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

export async function deleteTransactionById(id: string, dateStr: string) {
  const sheetName = getMonthlySheetName(new Date(dateStr));
  const rowIndex = await findRowIndexById(sheetName, id);

  if (rowIndex) {
    await deleteSheetRow(sheetName, rowIndex);
  } else {
    throw new Error("Transaction not found");
  }
}

export async function getAllTransactionSheetData(): Promise<string[][]> {
  const sheets = await getSheets();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const transactionSheets =
    spreadsheet.data.sheets
      ?.map((s) => s.properties?.title)
      .filter(
        (title): title is string => !!title && title.startsWith("Transactions_")
      ) || [];

  const allRows: string[][] = [];
  for (const sheetName of transactionSheets) {
    const data = await getSheetData(`${sheetName}!A2:H`);
    if (data) {
      allRows.push(...data);
    }
  }
  return allRows;
}

export async function getRangeData(startDate: Date, endDate: Date) {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  const allTransactions: string[][] = [];

  for (const month of months) {
    const sheetName = getMonthlySheetName(month);
    const data = await getSheetData(`${sheetName}!A2:H`);
    if (data) {
      allTransactions.push(...data);
    }
  }
  return allTransactions;
}

export async function deleteMultipleRowsByWalletId(walletId: string) {
  const sheets = await getSheets();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const transactionSheets =
    spreadsheet.data.sheets
      ?.map((s) => ({ title: s.properties?.title, sheetId: s.properties?.sheetId }))
      .filter(
        (s): s is { title: string; sheetId: number } => !!s.title && s.title.startsWith("Transactions_")
      ) || [];

  for (const { title, sheetId } of transactionSheets) {
    if (!sheetId) continue;
    const data = await getSheetData(`${title}!A:H`);
    if (!data) continue;

    const rowsToDelete: number[] = [];
    data.forEach((row, idx) => {
      // row[6] is WalletId, row[7] is ToWalletId
      if (row[6] === walletId || row[7] === walletId) {
        rowsToDelete.push(idx + 1);
      }
    });

    if (rowsToDelete.length === 0) continue;

    const requests = rowsToDelete.map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: rowIndex - 1,
          endIndex: rowIndex,
        },
      },
    }));

    requests.reverse(); // Reverse indices

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });
  }
}

export async function deleteWalletById(id: string) {
  const rowIndex = await findRowIndexById("Wallets", id);
  if (rowIndex) {
    await deleteSheetRow("Wallets", rowIndex);
  } else {
    throw new Error("Wallet not found");
  }
}
