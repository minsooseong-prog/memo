import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "./auth";
import { UNLOCK_COOKIE } from "./constants";
import { getAuthEnv, getPinHash } from "./env";
import { verifyUnlockToken } from "./unlock-token";

export type CurrentUser = { id: string; name: string; email: string };
export type SessionInfo = { user: CurrentUser; sessionId: string };

/** 현재 요청의 로그인 세션 (요청 단위 캐시 — 다른 사용자와 공유되지 않음) */
export const getSessionInfo = cache(async (): Promise<SessionInfo | null> => {
  // 요청 헤더를 "먼저" 읽어야 Next.js 가 이 화면을 빌드 때 미리 만들지 않고 요청마다 그립니다.
  // (빌드 단계에서 인증 비밀키·DB 주소를 요구하지 않게 됨 — 개인 데이터 화면이 캐시되는 것도 방지)
  const requestHeaders = await headers();
  const result = await getAuth().api.getSession({ headers: requestHeaders });
  if (!result) return null;
  return {
    sessionId: result.session.id,
    user: { id: result.user.id, name: result.user.name, email: result.user.email },
  };
});

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => (await getSessionInfo())?.user ?? null);

/** PIN 으로 잠금 해제된 상태인지 (서명·만료·세션 일치 검증) */
export const isUnlocked = cache(async (): Promise<boolean> => {
  const info = await getSessionInfo();
  if (!info) return false;
  const store = await cookies();
  return verifyUnlockToken(store.get(UNLOCK_COOKIE)?.value, {
    sessionId: info.sessionId,
    secret: getAuthEnv().BETTER_AUTH_SECRET,
    pinHash: getPinHash(),
  });
});

/** 로그인만 확인 (PIN 입력 화면 전용) */
export async function requireLoggedIn(): Promise<SessionInfo> {
  const info = await getSessionInfo();
  if (!info) redirect("/login");
  return info;
}

/**
 * 모든 페이지·서버 액션·데이터 조회의 첫 줄에서 호출합니다.
 * 1) DB 세션으로 로그인 확인  2) PIN 잠금 해제 확인
 * proxy.ts 의 쿠키 확인은 빠른 1차 차단일 뿐이며, 실제 검증은 여기서 합니다.
 */
export async function requireUser(): Promise<CurrentUser> {
  const info = await requireLoggedIn();
  if (!(await isUnlocked())) redirect("/unlock");
  return info.user;
}

/** API 라우트용: 로그인 + 잠금 해제가 모두 되었을 때만 사용자 반환 */
export async function getUnlockedUser(): Promise<CurrentUser | null> {
  const info = await getSessionInfo();
  if (!info || !(await isUnlocked())) return null;
  return info.user;
}
