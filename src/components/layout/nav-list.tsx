"use client";

import { BookHeart, CalendarDays, LayoutDashboard, NotebookPen, Plus, Search, Settings, Star, Trash2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/notes", label: "메모", icon: NotebookPen },
  { href: "/diary", label: "일기", icon: BookHeart },
  { href: "/diary/calendar", label: "일기 캘린더", icon: CalendarDays },
  { href: "/favorites", label: "즐겨찾기", icon: Star },
  { href: "/search", label: "검색", icon: Search },
  { href: "/trash", label: "휴지통", icon: Trash2 },
  { href: "/settings", label: "설정", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/diary") return pathname === "/diary" || (pathname.startsWith("/diary/") && !pathname.startsWith("/diary/calendar"));
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="주 메뉴" className="space-y-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-card font-medium text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-primary")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function QuickActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link href="/notes/new" onClick={onNavigate} className={buttonVariants({ size: "sm", className: "w-full" })}>
        <Plus /> 새 메모
      </Link>
      <Link href="/diary/new" onClick={onNavigate} className={buttonVariants({ size: "sm", variant: "outline", className: "w-full" })}>
        <BookHeart /> 오늘 일기
      </Link>
    </div>
  );
}
