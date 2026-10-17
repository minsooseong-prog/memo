import { existsSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// 운영 DB: .env.production.local 을 읽습니다 (npm run db:migrate:prod 전용).
if (!existsSync(".env.production.local")) {
  throw new Error(".env.production.local 파일이 없습니다. 운영 DB 주소를 넣어 만든 뒤 실행하세요 (README 10장).");
}
loadEnvConfig(process.cwd(), false);

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  throw new Error("DATABASE_URL 이 없습니다. .env.production.local 파일을 확인하세요 (README 10장).");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
