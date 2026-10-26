import { cacheLife, cacheTag } from "next/cache";
import { fetchExchangeRates, type ExchangeRates } from "@/lib/exchange";
import { tags } from "./tags";

export async function getRates(): Promise<ExchangeRates> {
  "use cache";
  cacheTag(tags.rates);
  const rates = await fetchExchangeRates();
  // Live rates are good for 30 minutes; estimated ones are retried within a minute or two.
  cacheLife(
    rates.estimated
      ? { stale: 60, revalidate: 60, expire: 120 }
      : { stale: 300, revalidate: 1800, expire: 86400 }
  );
  return rates;
}
