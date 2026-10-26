import { google, sheets_v4 } from "googleapis";
import type { Row } from "./mappers";

let sheetsClient: sheets_v4.Sheets | null = null;

export function getSpreadsheetId(): string {
  const id = process.env.SPREADSHEET_ID;
  if (!id) throw new Error("SPREADSHEET_ID is not set");
  return id;
}

export function getSheets(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key || !process.env.SPREADSHEET_ID) {
    throw new Error(
      "Missing Google credentials: set GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY and SPREADSHEET_ID"
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key.replace(/\\n/g, "\n") },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

// ─── Write serialization ─────────────────────────────────────────────────────
// Edits and deletes address rows by number, so two writes running at once can
// hit the wrong row after one of them shifts the sheet. Every write goes through
// this queue and looks its row up again once it holds the lock. This only
// serializes within one server process, which is enough for a single-user app.

let writeQueue: Promise<unknown> = Promise.resolve();

export function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.catch(() => undefined);
  return run;
}

// ─── Reads ───────────────────────────────────────────────────────────────────

function isMissingRangeError(error: unknown) {
  return error instanceof Error && error.message.includes("Unable to parse range");
}

/**
 * Reads a range as raw values. A sheet that does not exist yet (e.g. a month
 * with no transactions) reads as empty; any other failure is thrown so the UI
 * can show an error instead of pretending there is no data.
 */
export async function readRange(range: string): Promise<Row[]> {
  try {
    const response = await getSheets().spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    return (response.data.values as Row[] | undefined) ?? [];
  } catch (error) {
    if (isMissingRangeError(error)) return [];
    throw error;
  }
}

/** Several ranges in one request (one read against the quota instead of many). */
export async function readRanges(ranges: string[]): Promise<Row[][]> {
  if (ranges.length === 0) return [];
  const response = await getSheets().spreadsheets.values.batchGet({
    spreadsheetId: getSpreadsheetId(),
    ranges,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return (response.data.valueRanges ?? []).map((r) => (r.values as Row[] | undefined) ?? []);
}

export interface SheetInfo {
  title: string;
  sheetId: number;
}

// Sheet titles and ids rarely change and every write needs them, so they are
// kept briefly in memory (Sheets allows only 60 reads per minute). Our own
// add/delete calls drop the cache; edits made by hand are seen within a minute.
const SHEET_LIST_TTL_MS = 60_000;
let sheetList: { at: number; sheets: Promise<SheetInfo[]> } | null = null;

function forgetSheetList() {
  sheetList = null;
}

export function listSheets(): Promise<SheetInfo[]> {
  if (!sheetList || Date.now() - sheetList.at > SHEET_LIST_TTL_MS) {
    const sheets = fetchSheetList();
    sheetList = { at: Date.now(), sheets };
    sheets.catch(() => {
      if (sheetList?.sheets === sheets) forgetSheetList();
    });
  }
  return sheetList.sheets;
}

async function fetchSheetList(): Promise<SheetInfo[]> {
  const response = await getSheets().spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets.properties(title,sheetId)",
  });
  return (response.data.sheets ?? []).flatMap((s) => {
    const { title, sheetId } = s.properties ?? {};
    // sheetId 0 is valid (the first sheet), so check for undefined explicitly.
    return typeof title === "string" && typeof sheetId === "number"
      ? [{ title, sheetId }]
      : [];
  });
}

/** 1-based spreadsheet row number of the row whose column A equals `id`. */
export async function findRowNumber(sheet: string, id: string): Promise<number | null> {
  const rows = await readRange(`${sheet}!A:A`);
  const index = rows.findIndex((row) => String(row[0] ?? "") === id);
  return index === -1 ? null : index + 1;
}

// ─── Writes (call only inside withWriteLock) ─────────────────────────────────

export async function appendRow(sheet: string, values: (string | number)[]) {
  await getSheets().spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheet}!A:H`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function writeRanges(data: { range: string; values: (string | number)[][] }[]) {
  await getSheets().spreadsheets.values.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: { valueInputOption: "USER_ENTERED", data },
  });
}

/** Deletes the given 1-based row numbers from one sheet in a single request. */
export async function deleteRows(sheet: string, rowNumbers: number[]) {
  if (rowNumbers.length === 0) return;
  const info = (await listSheets()).find((s) => s.title === sheet);
  if (!info) throw new Error(`Sheet ${sheet} not found`);

  // Delete bottom-up so earlier deletions don't shift the rows still to go.
  const requests = [...new Set(rowNumbers)]
    .sort((a, b) => b - a)
    .map((row) => ({
      deleteDimension: {
        range: {
          sheetId: info.sheetId,
          dimension: "ROWS",
          startIndex: row - 1,
          endIndex: row,
        },
      },
    }));

  await getSheets().spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: { requests },
  });
}

/** Creates `sheet` with a header row if it is missing. Returns true when it was created. */
export async function ensureSheet(sheet: string, headers: string[]): Promise<boolean> {
  const existing = await listSheets();
  if (existing.some((s) => s.title === sheet)) return false;

  await getSheets().spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: { requests: [{ addSheet: { properties: { title: sheet } } }] },
  });
  forgetSheetList();
  await getSheets().spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheet}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
  console.log(`[sheets] created sheet ${sheet}`);
  return true;
}

export async function deleteSheet(sheetId: number) {
  await getSheets().spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: { requests: [{ deleteSheet: { sheetId } }] },
  });
  forgetSheetList();
}
