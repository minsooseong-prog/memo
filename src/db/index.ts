import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { getDatabaseUrl } from "@/lib/env";
import * as schema from "./schema";

// Neon 서버리스 드라이버(WebSocket Pool): 트랜잭션을 지원하며 Vercel 함수에서 동작합니다.
neonConfig.webSocketConstructor = ws;

function createDb() {
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 5, idleTimeoutMillis: 10_000 });
  // 유휴 연결이 끊겨도 프로세스가 죽지 않도록 오류를 기록만 합니다.
  pool.on("error", (error: Error) => console.error(`[db] pool error: ${error.message}`));
  return drizzle({ client: pool, schema });
}

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { __myArchiveDb?: Db };

export function getDb(): Db {
  if (!globalForDb.__myArchiveDb) globalForDb.__myArchiveDb = createDb();
  return globalForDb.__myArchiveDb;
}
