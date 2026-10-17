import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// 개발 DB: .env.local 을 읽습니다.
loadEnvConfig(process.cwd(), true);

// 마이그레이션(DDL)은 풀러를 거치지 않는 직접 연결을 우선 사용합니다.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  throw new Error("DATABASE_URL 이 없습니다. .env.local 파일을 확인하세요 (README 3장).");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
