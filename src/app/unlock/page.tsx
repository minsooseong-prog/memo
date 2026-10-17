import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/account-buttons";
import { isPinConfigured } from "@/lib/env";
import { isUnlocked, requireLoggedIn } from "@/lib/session";
import { firstParam, safeNextPath, type SearchParams } from "@/lib/utils";
import { UnlockForm } from "./unlock-form";

export const metadata: Metadata = { title: "잠금 해제" };

export default async function UnlockPage({ searchParams }: { searchParams: SearchParams }) {
  const info = await requireLoggedIn();
  const next = safeNextPath(firstParam((await searchParams).next));
  const configured = isPinConfigured();
  if (configured && (await isUnlocked())) redirect(next);

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-xs animate-rise text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">잠겨 있습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">{info.user.name}님의 비밀번호를 입력하면 열립니다.</p>
        {configured ? (
          <UnlockForm next={next} />
        ) : (
          <p role="alert" className="mt-6 rounded-lg bg-destructive/10 px-3 py-3 text-left text-sm text-destructive">
            PIN 이 아직 설정되지 않았습니다. 서버 환경변수 APP_PIN_HASH 를 등록해 주세요 (README 6장).
          </p>
        )}
        <div className="mt-8">
          <LogoutButton variant="ghost" label="다른 계정으로 로그인" className="text-muted-foreground" />
        </div>
      </div>
    </main>
  );
}
