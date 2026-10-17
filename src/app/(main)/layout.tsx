import { AppSidebar } from "@/components/layout/app-sidebar";
import { IdleLock } from "@/components/layout/idle-lock";
import { MobileNav } from "@/components/layout/mobile-nav";
import { requireUser } from "@/lib/session";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
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
