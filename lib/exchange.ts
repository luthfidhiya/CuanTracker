export interface ExchangeRates {
  usdToIdr: number;
  btcToUsd: number;
  ethToUsd: number;
  usdcToUsd: number;
  /** True when at least one source failed and older or default values were used. */
  estimated: boolean;
}

type FiatRates = Pick<ExchangeRates, "usdToIdr">;
type CryptoRates = Pick<ExchangeRates, "btcToUsd" | "ethToUsd" | "usdcToUsd">;

// Only used when a source has never answered since the server started.
// Approximate values as of October 2026; refresh them now and then.
const DEFAULT_FIAT: FiatRates = { usdToIdr: 18000 };
const DEFAULT_CRYPTO: CryptoRates = { btcToUsd: 80000, ethToUsd: 2300, usdcToUsd: 1 };

const REQUEST_TIMEOUT_MS = 5000;

// Last successful answer per source, so an outage falls back to recent rates
// instead of the hardcoded defaults.
let lastFiat: FiatRates | null = null;
let lastCrypto: CryptoRates | null = null;

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
}

const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

async function fetchFiat(): Promise<FiatRates> {
  const data = (await getJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR")) as {
    rates?: { IDR?: unknown };
  };
  const idr = data?.rates?.IDR;
  if (!positive(idr)) throw new Error("Frankfurter: missing IDR rate");
  return { usdToIdr: idr };
}

async function fetchCrypto(): Promise<CryptoRates> {
  const data = (await getJson(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin&vs_currencies=usd"
  )) as Record<string, { usd?: unknown } | undefined>;
  const btc = data?.bitcoin?.usd;
  const eth = data?.ethereum?.usd;
  const usdc = data?.["usd-coin"]?.usd;
  if (!positive(btc) || !positive(eth) || !positive(usdc)) throw new Error("CoinGecko: missing prices");
  return { btcToUsd: btc, ethToUsd: eth, usdcToUsd: usdc };
}

/**
 * Live rates from Frankfurter (USD→IDR) and CoinGecko (crypto→USD). Never
 * throws: a failed source falls back to its last good answer, or to defaults,
 * and the result is marked `estimated` so the UI can say so.
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const [fiat, crypto] = await Promise.allSettled([fetchFiat(), fetchCrypto()]);

  if (fiat.status === "fulfilled") lastFiat = fiat.value;
  else console.warn("[rates] fiat rates unavailable:", fiat.reason instanceof Error ? fiat.reason.message : fiat.reason);
  if (crypto.status === "fulfilled") lastCrypto = crypto.value;
  else console.warn("[rates] crypto rates unavailable:", crypto.reason instanceof Error ? crypto.reason.message : crypto.reason);

  return {
    ...(lastFiat ?? DEFAULT_FIAT),
    ...(lastCrypto ?? DEFAULT_CRYPTO),
    estimated: fiat.status === "rejected" || crypto.status === "rejected",
  };
}

export function convertToUsd(amount: number, currencyCode: string, rates: ExchangeRates): number {
  switch (currencyCode) {
    case "USD":  return amount;
    case "IDR":  return amount / rates.usdToIdr;
    case "BTC":  return amount * rates.btcToUsd;
    case "ETH":  return amount * rates.ethToUsd;
    case "USDC": return amount * rates.usdcToUsd;
    default:     return amount; // Fallback for unknown
  }
}
