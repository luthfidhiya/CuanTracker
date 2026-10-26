import { describe, expect, it } from "vitest";
import {
  currentMonthKey,
  isIsoDate,
  lastDayOfMonth,
  monthKeyFromDate,
  monthKeyFromSheetName,
  monthsBetween,
  sheetNameForMonth,
  shiftMonth,
  todayIso,
} from "./schema";

describe("sheetNameForMonth", () => {
  it("matches the names older versions created with date-fns MMMyyy", () => {
    expect(sheetNameForMonth("2026-10")).toBe("Transactions_Oct2026");
    expect(sheetNameForMonth("2026-01")).toBe("Transactions_Jan2026");
    expect(sheetNameForMonth("2025-12")).toBe("Transactions_Dec2025");
  });

  it("round-trips through monthKeyFromSheetName", () => {
    for (const key of ["2026-01", "2026-06", "2026-12"]) {
      expect(monthKeyFromSheetName(sheetNameForMonth(key))).toBe(key);
    }
    expect(monthKeyFromSheetName("Wallets")).toBeNull();
    expect(monthKeyFromSheetName("Transactions_Foo2026")).toBeNull();
  });

  it("rejects invalid months", () => {
    expect(() => sheetNameForMonth("2026-13")).toThrow();
  });
});

describe("monthKeyFromDate", () => {
  it("uses the date's own month regardless of the server time zone", () => {
    // new Date("2026-10-01") is UTC midnight, which is still September in
    // zones behind UTC; the string-based version must not shift.
    expect(monthKeyFromDate("2026-10-01")).toBe("2026-10");
    expect(monthKeyFromDate("2026-09-30")).toBe("2026-09");
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => monthKeyFromDate("2026-02-30")).toThrow();
    expect(() => monthKeyFromDate("Oct 2026")).toThrow();
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
  });
});

describe("month arithmetic", () => {
  it("shifts across year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-05", -17)).toBe("2024-12");
  });

  it("lists months inclusively", () => {
    expect(monthsBetween("2026-11", "2027-02")).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
    expect(monthsBetween("2026-10", "2026-10")).toEqual(["2026-10"]);
    expect(monthsBetween("2026-10", "2026-09")).toEqual([]);
  });

  it("knows month lengths", () => {
    expect(lastDayOfMonth("2026-02")).toBe("2026-02-28");
    expect(lastDayOfMonth("2024-02")).toBe("2024-02-29");
    expect(lastDayOfMonth("2026-10")).toBe("2026-10-31");
  });
});

describe("todayIso", () => {
  it("uses Jakarta time, not UTC", () => {
    // 2026-10-31 20:00 UTC is already 1 Nov 03:00 in Jakarta.
    const now = new Date("2026-10-31T20:00:00Z");
    expect(todayIso(now)).toBe("2026-11-01");
    expect(currentMonthKey(now)).toBe("2026-11");
  });
});
