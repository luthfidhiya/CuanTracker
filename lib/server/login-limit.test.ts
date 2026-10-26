import { describe, expect, it } from "vitest";
import { clientKey, LoginLimiter, passwordMatches } from "./login-limit";

const MINUTE = 60_000;

function limiter() {
  let now = 0;
  const l = new LoginLimiter(() => now);
  return { l, advance: (ms: number) => (now += ms) };
}

describe("LoginLimiter", () => {
  it("blocks a client after 5 failures until the window ends", () => {
    const { l, advance } = limiter();
    for (let i = 0; i < 4; i++) l.fail("a");
    expect(l.retryAfter("a")).toBe(0);
    l.fail("a");
    expect(l.retryAfter("a")).toBe(15 * MINUTE);
    expect(l.retryAfter("b")).toBe(0);
    advance(15 * MINUTE);
    expect(l.retryAfter("a")).toBe(0);
  });

  it("clears a client's failures after a successful login", () => {
    const { l } = limiter();
    for (let i = 0; i < 4; i++) l.fail("a");
    l.succeed("a");
    l.fail("a");
    expect(l.retryAfter("a")).toBe(0);
  });

  it("blocks everyone after 30 failures from rotating clients", () => {
    const { l } = limiter();
    for (let i = 0; i < 30; i++) l.fail(`ip-${i}`);
    expect(l.retryAfter("fresh")).toBeGreaterThan(0);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});

describe("passwordMatches", () => {
  it("compares exactly", () => {
    expect(passwordMatches("rahasia", "rahasia")).toBe(true);
    expect(passwordMatches("rahasi", "rahasia")).toBe(false);
  });
});
