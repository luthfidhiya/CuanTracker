
export interface ExchangeRates {
  usdToIdr: number;
  btcToUsd: number;
  ethToUsd: number;
  usdcToUsd: number;
}

let rateCache: { rates: ExchangeRates; fetchedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL) {
    return rateCache.rates;
  }

  // Fallback default rates in case APIs fail
  const rates: ExchangeRates = {
    usdToIdr: 16000,
    btcToUsd: 65000,
    ethToUsd: 3500,
    usdcToUsd: 1.0,
  };

  try {
    // 1. Fetch Fiat (USD -> IDR) via Frankfurter
    try {
      const fiatRes = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR", { next: { revalidate: 1800 } });
      if (fiatRes.ok) {
        const fiatData = await fiatRes.json();
        if (fiatData?.rates?.IDR) {
          rates.usdToIdr = fiatData.rates.IDR;
        }
      }
    } catch (e) {
      console.error("Failed to fetch fiat rates:", e);
    }

    // 2. Fetch Crypto (BTC, ETH, USDC -> USD) via CoinGecko Demo
    try {
      const cryptoRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin&vs_currencies=usd", { next: { revalidate: 1800 } });
      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json();
        if (cryptoData?.bitcoin?.usd) rates.btcToUsd = cryptoData.bitcoin.usd;
        if (cryptoData?.ethereum?.usd) rates.ethToUsd = cryptoData.ethereum.usd;
        if (cryptoData?.['usd-coin']?.usd) rates.usdcToUsd = cryptoData['usd-coin'].usd;
      }
    } catch (e) {
      console.error("Failed to fetch crypto rates:", e);
    }

    rateCache = { rates, fetchedAt: Date.now() };
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
  }

  return rates;
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
