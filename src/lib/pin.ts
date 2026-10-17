import "server-only";
import { verifyPassword } from "better-auth/crypto";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { pinAttempts } from "@/db/schema";
import { PIN_RULES, UNLOCK_COOKIE } from "./constants";
import { getAuthEnv, getPinHash } from "./env";
import { createUnlockToken } from "./unlock-token";

export async function verifyPin(pin: string): Promise<boolean> {
  return verifyPassword({ hash: getPinHash(), password: pin });
}

export async function checkPinAllowed(userId: string): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  const rows = await getDb().select().from(pinAttempts).where(eq(pinAttempts.userId, userId)).limit(1);
  const lockedUntil = rows[0]?.lockedUntil;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return { allowed: false, retryAfterSec: Math.ceil((lockedUntil.getTime() - Date.now()) / 1000) };
  }
  return { allowed: true };
}

/** 실패 1회 기록. 한도에 도달하면 잠그고 횟수를 초기화합니다. */
export async function recordPinFailure(userId: string): Promise<{ locked: boolean; remaining: number }> {
  const db = getDb();
  const [row] = await db
    .insert(pinAttempts)
    .values({ userId, failures: 1 })
    .onConflictDoUpdate({
      target: pinAttempts.userId,
      set: { failures: sql`${pinAttempts.failures} + 1`, updatedAt: sql`now()` },
    })
    .returning({ failures: pinAttempts.failures });
  const failures = row?.failures ?? 1;
  if (failures >= PIN_RULES.maxFailures) {
    await db
      .update(pinAttempts)
      .set({ failures: 0, lockedUntil: new Date(Date.now() + PIN_RULES.lockMinutes * 60_000), updatedAt: sql`now()` })
      .where(eq(pinAttempts.userId, userId));
    return { locked: true, remaining: 0 };
  }
  return { locked: false, remaining: PIN_RULES.maxFailures - failures };
}

export async function clearPinFailures(userId: string): Promise<void> {
  await getDb().delete(pinAttempts).where(eq(pinAttempts.userId, userId));
}

/** 잠금 해제 쿠키: httpOnly, SameSite=Strict, 브라우저 세션 쿠키(닫으면 사라짐) + 토큰 자체 만료 */
export async function setUnlockCookie(sessionId: string): Promise<void> {
  const token = createUnlockToken({
    sessionId,
    secret: getAuthEnv().BETTER_AUTH_SECRET,
    pinHash: getPinHash(),
    ttlMs: PIN_RULES.unlockHours * 60 * 60 * 1000,
  });
  const store = await cookies();
  store.set(UNLOCK_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export async function clearUnlockCookie(): Promise<void> {
  const store = await cookies();
  store.delete(UNLOCK_COOKIE);
}
