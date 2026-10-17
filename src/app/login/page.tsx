import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { firstParam, safeNextPath, type SearchParams } from "@/lib/utils";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNextPath(firstParam((await searchParams).next));
  if (await getCurrentUser()) redirect(next);

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18v16H6.5A1.5 1.5 0 0 0 5 20.5v-16Z" />
              <path d="M5 20.5A1.5 1.5 0 0 0 6.5 22H18v-3" />
              <path d="M9 8h5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-muted-foreground">나만 열어 볼 수 있는 기록 공간입니다.</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
