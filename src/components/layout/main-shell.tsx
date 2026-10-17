import { requireUser } from "@/lib/session";
import { AppSidebar } from "./app-sidebar";
import { IdleLock } from "./idle-lock";
import { MobileNav } from "./mobile-nav";

/** 로그인·잠금 해제 후 화면의 공통 틀(사이드바, 모바일 메뉴, 자동 잠금) */
export async function MainShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <IdleLock />
      <AppSidebar userName={user.name} />
      <MobileNav userName={user.name} />
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-5 md:px-10 md:pt-10">{children}</main>
      </div>
    </div>
  );
}
