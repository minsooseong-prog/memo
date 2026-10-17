import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import { account, rateLimit, session, user, verification } from "@/db/schema";
import { LIMITS, APP_NAME } from "./constants";
import { getAuthEnv, getSiteUrls } from "./env";

function createAuth() {
  const { BETTER_AUTH_SECRET } = getAuthEnv();
  const { baseURL, trustedOrigins } = getSiteUrls();

  return betterAuth({
    appName: APP_NAME,
    secret: BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification, rateLimit },
    }),
    emailAndPassword: {
      enabled: true,
      // 공개 회원가입 금지: 소유자 계정은 npm run owner:create 로만 만듭니다.
      disableSignUp: true,
      minPasswordLength: LIMITS.passwordMin,
      maxPasswordLength: LIMITS.passwordMax,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14, // 14일
      updateAge: 60 * 60 * 24, // 하루마다 만료 연장
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 300, max: 5 },
        "/change-password": { window: 300, max: 5 },
      },
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { __myArchiveAuth?: Auth };

/** 처음 사용할 때 생성(빌드 단계에서 환경변수를 요구하지 않도록) */
export function getAuth(): Auth {
  if (!globalForAuth.__myArchiveAuth) globalForAuth.__myArchiveAuth = createAuth();
  return globalForAuth.__myArchiveAuth;
}
