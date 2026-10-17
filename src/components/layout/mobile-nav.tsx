"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { LockButton, LogoutButton, ThemeToggle } from "@/components/layout/account-buttons";
import { NavList, QuickActions } from "./nav-list";

export function MobileNav({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b bg-background/85 px-2 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <Button variant="ghost" size="icon" aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu />
        </Button>
        <Link href="/" className="flex-1 truncate font-semibold tracking-tight">
          {APP_NAME}
        </Link>
        <Link href="/search" aria-label="검색" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <Search />
        </Link>
        <ThemeToggle />
      </header>

      <dialog
        ref={dialogRef}
        aria-label="메뉴"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="m-0 h-dvh max-h-dvh w-[82vw] max-w-xs bg-sidebar p-0 text-foreground backdrop:bg-black/40 md:hidden"
      >
        <div className="flex h-full flex-col pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="font-semibold">{APP_NAME}</span>
            <Button variant="ghost" size="icon" aria-label="메뉴 닫기" onClick={close}>
              <X />
            </Button>
          </div>
          <div className="px-3 pb-4">
            <QuickActions onNavigate={close} />
          </div>
          <div className="flex-1 overflow-y-auto px-3">
            <NavList onNavigate={close} />
          </div>
          <div className="flex items-center gap-2 border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{userName}</span>
            <LockButton />
            <LogoutButton variant="outline" />
          </div>
        </div>
      </dialog>
    </>
  );
}
