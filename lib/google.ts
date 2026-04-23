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

export async function createSheetIfNotExists(sheetName: string, headers: string[]) {
  if (sheetsInitialized.has(sheetName)) return false;

  const sheets = await getSheets();

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const existingSheets =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spreadsheet.data.sheets?.map((s: any) => s.properties?.title) || [];

  if (existingSheets.includes(sheetName)) {
    sheetsInitialized.add(sheetName);
    return false;
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
  return true;
}

export async function updateWalletFormulas() {
  const sheets = await getSheets();
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });

  const transactionSheets = spreadsheet.data.sheets
    ?.map(s => s.properties?.title)
    .filter((title): title is string => !!title && title.startsWith("Transactions_")) || [];

  const walletsRangeData = await getSheetData("Wallets!A2:H");
  if (!walletsRangeData || walletsRangeData.length === 0) return;

  const values = walletsRangeData.map((row, idx) => {
    const rowNum = idx + 2;
    let formula = `=D${rowNum}`;

    if (transactionSheets.length > 0) {
      for (const sheetName of transactionSheets) {
        formula += ` + SUMPRODUCT((${sheetName}!D$2:D$9999="INCOME") * (${sheetName}!G$2:G$9999=A${rowNum}) * ${sheetName}!C$2:C$9999)`;
        formula += ` - SUMPRODUCT((${sheetName}!D$2:D$9999="EXPENSE") * (${sheetName}!G$2:G$9999=A${rowNum}) * ${sheetName}!C$2:C$9999)`;
        formula += ` - SUMPRODUCT((${sheetName}!D$2:D$9999="TRANSFER") * (${sheetName}!G$2:G$9999=A${rowNum}) * ${sheetName}!C$2:C$9999)`;
        formula += ` + SUMPRODUCT((${sheetName}!D$2:D$9999="TRANSFER") * (${sheetName}!H$2:H$9999=A${rowNum}) * ${sheetName}!C$2:C$9999)`;
      }
    }
    return [formula];
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Wallets!H1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [["CurrentBalance"]] },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Wallets!H2:H${values.length + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

export async function initializeSheets() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      let sheetCreated = false;
      
      const createdWallet = await createSheetIfNotExists("Wallets", [
        "ID", "Name", "Type", "InitialBalance", "Color", "CurrencyCode", "CurrencySymbol", "CurrentBalance",
      ]);
      if (createdWallet) sheetCreated = true;
      
      const createdCat = await createSheetIfNotExists("Categories", [
        "ID",
        "Name",
        "Type",
        "Color",
      ]);
      if (createdCat) sheetCreated = true;
      
      const currentMonthSheet = getMonthlySheetName();
      const createdTransaction = await createSheetIfNotExists(currentMonthSheet, [
        "ID",
        "Date",
        "Amount",
        "Type",
        "Category",
        "Description",
        "WalletId",
        "ToWalletId",
      ]);
      if (createdTransaction) sheetCreated = true;

      if (sheetCreated) {
        await updateWalletFormulas();
      }

      // Cleanup default "Sheet1" if it exists and we have other sheets
      const sheets = await getSheets();
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const sheet1 = spreadsheet.data.sheets?.find(s => s.properties?.title === "Sheet1");
      const totalSheets = spreadsheet.data.sheets?.length || 0;
      
      if (sheet1 && sheet1.properties?.sheetId !== undefined && totalSheets > 1) {
        console.log("🧹 Cleaning up default Sheet1");
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{ deleteDimension: { range: { sheetId: sheet1.properties.sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 } } }]
          }
        }).catch(() => {}); // ignore errors, we actually want deleteSheet
        
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{ deleteSheet: { sheetId: sheet1.properties.sheetId } }]
          }
        }).catch((e) => console.log("Failed to delete Sheet1:", e.message));
      }

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
      valueRenderOption: "UNFORMATTED_VALUE",
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

export async function appendSheetData(range: string, values: (string | number)[]) {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  return response.data;
}



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

export async function updateSheetRow(range: string, values: (string | number)[]) {
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
