// DB 연결과 테이블 상태 점검 (읽기 전용)
//   npm run db:check         개발 DB
//   npm run db:check:prod    운영 DB
import { count, sql } from "drizzle-orm";
import { diaries, notes, user } from "../src/db/schema";
import { createScriptDb, fail, loadEnv } from "./lib/cli";

const EXPECTED = ["user", "session", "account", "verification", "rate_limit", "notes", "diaries", "tags", "note_tags", "diary_tags", "pin_attempts"];

async function main() {
  const { prod } = loadEnv();
  const { db, pool, host } = createScriptDb();
  console.log(`대상 DB: ${host} (${prod ? "운영" : "개발"})\n`);
  try {
    const now = await db.execute(sql`select now()::text as now`);
    console.log("✅ 연결 성공 — 서버 시각", now.rows[0]?.now);

    const tables = await db.execute(sql`select table_name from information_schema.tables where table_schema = 'public'`);
    const names = new Set(tables.rows.map((r) => String(r.table_name)));
    const missing = EXPECTED.filter((t) => !names.has(t));
    if (missing.length) {
      console.log(`❌ 없는 테이블: ${missing.join(", ")} → npm run db:migrate${prod ? ":prod" : ""} 를 실행하세요.`);
      process.exitCode = 1;
      return;
    }
    console.log("✅ 테이블 확인 완료");

    const [[users], [noteCount], [diaryCount]] = await Promise.all([
      db.select({ value: count() }).from(user),
      db.select({ value: count() }).from(notes),
      db.select({ value: count() }).from(diaries),
    ]);
    console.log(`   계정 ${users?.value ?? 0}개, 메모 ${noteCount?.value ?? 0}개, 일기 ${diaryCount?.value ?? 0}개`);
    if (!users?.value) console.log(`ℹ️  계정이 없습니다 → npm run owner:create${prod ? ":prod" : ""}`);
    console.log(process.env.APP_PIN_HASH ? "✅ APP_PIN_HASH 설정됨" : "⚠️  APP_PIN_HASH 가 없습니다 → npm run pin:hash");
  } finally {
    await pool.end();
  }
}

main().catch(fail);
