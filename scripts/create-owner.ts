// 소유자 계정 만들기 / 비밀번호 재설정
//   npm run owner:create                 개발 DB 에 소유자 계정 생성
//   npm run owner:create:prod            운영 DB 에 소유자 계정 생성
//   npm run owner:reset-password[:prod]  로그인 비밀번호 재설정(모든 기기 로그아웃)
// 공개 회원가입은 막혀 있으므로 이 스크립트로만 계정을 만들 수 있습니다.
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { account, session, user } from "../src/db/schema";
import { ownerSchema, passwordSchema } from "../src/lib/validation";
import { ask, askHidden, createScriptDb, fail, loadEnv } from "./lib/cli";

async function askNewPassword(): Promise<string> {
  const password = await askHidden("새 로그인 비밀번호(12자 이상): ");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "비밀번호를 확인하세요.");
  if ((await askHidden("한 번 더 입력: ")) !== password) throw new Error("두 비밀번호가 다릅니다.");
  return password;
}

async function main() {
  const { prod } = loadEnv();
  const reset = process.argv.includes("--reset-password");
  const { db, pool, host } = createScriptDb();
  console.log(`대상 DB: ${host} (${prod ? "운영" : "개발"})\n`);

  try {
    if (reset) {
      const email = (await ask("소유자 이메일: ")).toLowerCase();
      const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
      if (!owner) throw new Error("해당 이메일의 계정이 없습니다.");
      const hash = await hashPassword(await askNewPassword());
      await db.transaction(async (tx) => {
        const updated = await tx
          .update(account)
          .set({ password: hash, updatedAt: new Date() })
          .where(and(eq(account.userId, owner.id), eq(account.providerId, "credential")))
          .returning({ id: account.id });
        if (updated.length === 0) {
          await tx.insert(account).values({ id: randomUUID(), accountId: owner.id, providerId: "credential", userId: owner.id, password: hash });
        }
        await tx.delete(session).where(eq(session.userId, owner.id));
      });
      console.log("\n✅ 비밀번호를 바꾸고 모든 기기에서 로그아웃시켰습니다.");
      return;
    }

    const existing = await db.select({ id: user.id }).from(user).limit(1);
    if (existing.length) {
      throw new Error("이미 소유자 계정이 있습니다. 비밀번호를 바꾸려면 npm run owner:reset-password 를 쓰세요.");
    }

    const parsed = ownerSchema.safeParse({
      email: await ask("소유자 이메일: "),
      name: await ask("화면에 표시할 이름: "),
      password: await askNewPassword(),
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "입력을 확인하세요.");

    const hash = await hashPassword(parsed.data.password);
    const userId = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(user).values({ id: userId, name: parsed.data.name, email: parsed.data.email, emailVerified: true });
      await tx.insert(account).values({ id: randomUUID(), accountId: userId, providerId: "credential", userId, password: hash });
    });
    console.log(`\n✅ 소유자 계정을 만들었습니다: ${parsed.data.email}`);
  } finally {
    await pool.end();
  }
}

main().catch(fail);
