import { describe, expect, it } from "vitest";
import { createUnlockToken, isValidPinFormat, verifyUnlockToken } from "@/lib/unlock-token";

const ctx = { sessionId: "session-a", secret: "s".repeat(40), pinHash: "abcd:1234" };
const now = 1_800_000_000_000;

describe("PIN 잠금 해제 토큰", () => {
  const token = createUnlockToken({ ...ctx, ttlMs: 60_000, now });

  it("같은 세션에서 만료 전에는 유효하다", () => {
    expect(verifyUnlockToken(token, { ...ctx, now: now + 1_000 })).toBe(true);
  });
  it("만료되면 무효", () => {
    expect(verifyUnlockToken(token, { ...ctx, now: now + 61_000 })).toBe(false);
  });
  it("다른 로그인 세션에서는 무효", () => {
    expect(verifyUnlockToken(token, { ...ctx, sessionId: "session-b", now })).toBe(false);
  });
  it("PIN 을 바꾸면 무효", () => {
    expect(verifyUnlockToken(token, { ...ctx, pinHash: "ffff:0000", now })).toBe(false);
  });
  it("변조하면 무효", () => {
    const [exp, sig] = token.split(".");
    expect(verifyUnlockToken(`${Number(exp) + 1000}.${sig}`, { ...ctx, now })).toBe(false);
    expect(verifyUnlockToken(undefined, { ...ctx, now })).toBe(false);
  });
  it("PIN 형식은 숫자 4~12자리", () => {
    expect(isValidPinFormat("482913")).toBe(true);
    expect(isValidPinFormat("12a4")).toBe(false);
    expect(isValidPinFormat("123")).toBe(false);
  });
});
