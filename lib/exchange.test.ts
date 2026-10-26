import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIAT_URL = "frankfurter";
const CRYPTO_URL = "coingecko";

const fiatBody = { rates: { IDR: 18108 } };
const cryptoBody = { bitcoin: { usd: 79701 }, ethereum: { usd: 2307 }, "usd-coin": { usd: 0.9998 } };

/** Each source either answers with `body` or fails (network error or HTTP status). */
function mockFetch(fiat: object | number | "down", crypto: object | number | "down") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const answer = url.includes(FIAT_URL) ? fiat : url.includes(CRYPTO_URL) ? crypto : "down";
      if (answer === "down") throw new TypeError("fetch failed");
      if (typeof answer === "number") return new Response("", { status: answer });
      return Response.json(answer);
    })
  );
}

// The module keeps the last good rates in memory, so each test starts fresh.
async function freshModule() {
  vi.resetModules();
  return import("./exchange");
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchExchangeRates", () => {
  it("returns live rates when both sources answer", async () => {
    const { fetchExchangeRates } = await freshModule();
    mockFetch(fiatBody, cryptoBody);
    expect(await fetchExchangeRates()).toEqual({
      usdToIdr: 18108,
      btcToUsd: 79701,
      ethToUsd: 2307,
      usdcToUsd: 0.9998,
      estimated: false,
    });
  });

  it("keeps the last good rates during an outage instead of the defaults", async () => {
    const { fetchExchangeRates } = await freshModule();
    mockFetch(fiatBody, cryptoBody);
    await fetchExchangeRates();

    mockFetch(fiatBody, 429); // CoinGecko rate limit
    const rates = await fetchExchangeRates();
    expect(rates.estimated).toBe(true);
    expect(rates.ethToUsd).toBe(2307);
    expect(rates.usdToIdr).toBe(18108);
  });

  it("uses defaults only when a source has never answered, and says so", async () => {
    const { fetchExchangeRates } = await freshModule();
    mockFetch("down", "down");
    const rates = await fetchExchangeRates();
    expect(rates.estimated).toBe(true);
    expect(rates.usdToIdr).toBeGreaterThan(0);
    expect(rates.btcToUsd).toBeGreaterThan(0);
  });

  it("treats a malformed answer as a failure", async () => {
    const { fetchExchangeRates } = await freshModule();
    mockFetch({ rates: {} }, { bitcoin: { usd: "NaN" } });
    expect((await fetchExchangeRates()).estimated).toBe(true);
  });
});
