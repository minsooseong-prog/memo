import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { LockButton, LogoutButton, ThemeToggle } from "@/components/layout/account-buttons";
import { NavList, QuickActions } from "./nav-list";

export function AppSidebar({ userName }: { userName: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span aria-hidden className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          M
        </span>
        <Link href="/" className="font-semibold tracking-tight">
          {APP_NAME}
        </Link>
      </div>
      <div className="px-3 pb-4">
        <QuickActions />
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <NavList />
      </div>
      <div className="flex items-center gap-1 border-t px-3 py-3">
        <span className="min-w-0 flex-1 truncate px-2 text-sm text-muted-foreground">{userName}</span>
        <ThemeToggle />
        <LockButton />
        <LogoutButton variant="ghost" label="" className="size-9 px-0" />
      </div>
    </aside>
  );
}
