// CLI 스크립트 공통: 환경변수 로드, DB 연결, 입력 받기(비밀번호는 화면에 표시하지 않음)
import { existsSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { loadEnvConfig } from "@next/env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../../src/db/schema";

/** --prod 가 있으면 .env.production.local(운영 DB), 없으면 .env.local(개발 DB) */
export function loadEnv(): { prod: boolean } {
  const prod = process.argv.includes("--prod");
  if (prod && !existsSync(".env.production.local")) {
    throw new Error(".env.production.local 파일이 없습니다. 운영 DB 주소를 담아 만든 뒤 다시 실행하세요 (README 10장).");
  }
  loadEnvConfig(process.cwd(), !prod);
  return { prod };
}

export function createScriptDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL 이 없습니다. .env.local(또는 --prod 면 .env.production.local)을 확인하세요.");
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: url, max: 2 });
  return { db: drizzle({ client: pool, schema }), pool, host: new URL(url).host };
}

export async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** 입력한 글자를 * 로 가려서 받습니다. */
export async function askHidden(question: string): Promise<string> {
  if (!stdin.isTTY) return ask(question);
  stdout.write(question);
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    const onData = (chunk: Buffer | string) => {
      for (const ch of chunk.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          cleanup();
          stdout.write("\n");
          reject(new Error("취소했습니다."));
          return;
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        value += ch;
        stdout.write("*");
      }
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

export function fail(error: unknown): never {
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
