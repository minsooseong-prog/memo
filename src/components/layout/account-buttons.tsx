"use client";

import { Loader2, Lock, LogOut, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { lockAction } from "@/actions/lock";
import { Button, type ButtonProps } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useMounted } from "@/lib/hooks/use-mounted";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = mounted && resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "라이트 모드로 바꾸기" : "다크 모드로 바꾸기"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function LockButton({ label, variant = "ghost", className }: { label?: string } & Pick<ButtonProps, "variant" | "className">) {
  return (
    <form action={lockAction}>
      <Button type="submit" variant={variant} size={label ? "default" : "icon"} className={className} aria-label="지금 잠그기" title="지금 잠그기">
        <Lock />
        {label}
      </Button>
    </form>
  );
}

export function LogoutButton({ className, variant = "ghost", label = "로그아웃" }: Pick<ButtonProps, "className" | "variant"> & { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleLogout() {
    setPending(true);
    setFailed(false);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      router.replace("/login");
      router.refresh();
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <Button variant={variant} className={className} onClick={handleLogout} disabled={pending} aria-label="로그아웃" title="로그아웃">
      {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
      {failed ? "다시 시도" : label}
    </Button>
  );
}
