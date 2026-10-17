import { z } from "zod";

// 환경변수는 실제로 사용할 때 검증합니다. 값은 절대 로그에 남기지 않습니다.

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL 환경변수가 없습니다. 로컬은 .env.local, Vercel 은 Settings → Environment Variables 를 확인하세요.",
    );
  }
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error("DATABASE_URL 형식이 올바르지 않습니다. postgresql:// 로 시작해야 합니다.");
  }
  return url;
}

const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET 은 32자 이상이어야 합니다 (npm run gen-secret)."),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL 은 https://… 형식의 주소여야 합니다.").optional(),
});

export function getAuthEnv() {
  const parsed = authEnvSchema.safeParse({
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || undefined,
  });
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" / ");
    throw new Error(`인증 환경변수 설정 오류 — ${detail}`);
  }
  return parsed.data;
}

/** 로그인 요청을 허용할 사이트 주소 목록 */
export function getSiteUrls(): { baseURL: string; trustedOrigins: string[] } {
  const { BETTER_AUTH_URL } = getAuthEnv();
  const candidates = [
    BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
  ].filter((v): v is string => Boolean(v));
  const origins = Array.from(new Set(candidates.map((u) => new URL(u).origin)));
  return { baseURL: origins[0] ?? "http://localhost:3000", trustedOrigins: origins };
}

/** PIN 해시(scrypt). 평문 PIN 은 어디에도 저장하지 않습니다. */
export function getPinHash(): string {
  const hash = process.env.APP_PIN_HASH?.trim();
  if (!hash) {
    throw new Error("APP_PIN_HASH 환경변수가 없습니다. npm run pin:hash 로 만든 값을 등록하세요 (README 6장).");
  }
  if (!/^[0-9a-f]+:[0-9a-f]+$/i.test(hash)) {
    throw new Error("APP_PIN_HASH 형식이 올바르지 않습니다. npm run pin:hash 출력값을 그대로 넣으세요.");
  }
  return hash;
}

export function isPinConfigured(): boolean {
  return Boolean(process.env.APP_PIN_HASH?.trim());
}
