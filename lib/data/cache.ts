/**
 * Sheet reads are cached briefly: mutations invalidate their tags right away,
 * and the short lifetime picks up edits made directly in Google Sheets.
 */
export const SHEET_CACHE = { stale: 30, revalidate: 60, expire: 300 };
