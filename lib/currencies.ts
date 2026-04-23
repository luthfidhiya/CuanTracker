export interface CurrencyDef {
  code: string;       // "IDR", "USD", "BTC", "ETH", "USDC"
  symbol: string;     // "Rp", "$", "₿", "Ξ", "USDC"
  name: string;       // "Indonesian Rupiah"
  type: "fiat" | "crypto";
  decimals: number;   // 0 for IDR, 2 for USD, 8 for BTC, etc.
  coingeckoId?: string; // "bitcoin", "ethereum", "usd-coin" (for crypto only)
}

export const CURRENCIES: CurrencyDef[] = [
  { code: "IDR", symbol: "Rp",   name: "Indonesian Rupiah", type: "fiat",   decimals: 0 },
  { code: "USD", symbol: "$",    name: "US Dollar",         type: "fiat",   decimals: 2 },
  { code: "USDC",symbol: "USDC", name: "USD Coin",          type: "crypto", decimals: 2, coingeckoId: "usd-coin" },
  { code: "ETH", symbol: "Ξ",    name: "Ethereum",          type: "crypto", decimals: 6, coingeckoId: "ethereum" },
  { code: "BTC", symbol: "₿",    name: "Bitcoin",           type: "crypto", decimals: 8, coingeckoId: "bitcoin" },
];

export function getCurrency(code: string): CurrencyDef {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0]; // fallback IDR
}

export function formatCurrency(amount: number, code: string): string {
  const cur = getCurrency(code);
  if (cur.code === "IDR") return `${cur.symbol} ${amount.toLocaleString("id-ID")}`;
  return `${cur.symbol} ${amount.toLocaleString("en-US", { minimumFractionDigits: cur.decimals, maximumFractionDigits: cur.decimals })}`;
}
