// PIN 잠금 해제 토큰: "만료시각.서명" 형태의 HMAC 서명 값.
// - 로그인 세션 id 에 묶여 있어 로그아웃/재로그인하면 다시 PIN 을 입력해야 합니다.
// - PIN 해시가 서명에 섞여 있어 PIN 을 바꾸면 기존 해제 상태가 모두 무효가 됩니다.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type TokenContext = { sessionId: string; secret: string; pinHash: string };

function sign(payload: string, { secret, pinHash }: Omit<TokenContext, "sessionId">): string {
  const pinFingerprint = createHash("sha256").update(pinHash).digest("hex").slice(0, 16);
  return createHmac("sha256", secret).update(`unlock:${pinFingerprint}:${payload}`).digest("base64url");
}

export function createUnlockToken(ctx: TokenContext & { ttlMs: number; now?: number }): string {
  const expiresAt = (ctx.now ?? Date.now()) + ctx.ttlMs;
  return `${expiresAt}.${sign(`${ctx.sessionId}.${expiresAt}`, ctx)}`;
}

export function verifyUnlockToken(token: string | undefined, ctx: TokenContext & { now?: number }): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expStr, signature] = parts;
  if (!/^\d{10,16}$/.test(expStr)) return false;
  const expiresAt = Number(expStr);
  if (expiresAt < (ctx.now ?? Date.now())) return false;
  const expected = Buffer.from(sign(`${ctx.sessionId}.${expiresAt}`, ctx));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,12}$/.test(pin);
}
