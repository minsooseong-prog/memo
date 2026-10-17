"use client";

import { Loader2, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { LIMITS } from "@/lib/constants";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "system", label: "기기 설정", icon: Monitor },
] as const;

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  return (
    <div role="radiogroup" aria-label="화면 테마" className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border py-3 text-sm transition-colors",
              selected ? "border-primary bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const currentPassword = String(form.get("current") ?? "");
    const newPassword = String(form.get("next") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (newPassword.length < LIMITS.passwordMin) return setNotice({ ok: false, text: `새 비밀번호는 ${LIMITS.passwordMin}자 이상이어야 합니다.` });
    if (newPassword !== confirm) return setNotice({ ok: false, text: "새 비밀번호 확인이 일치하지 않습니다." });

    setPending(true);
    setNotice(null);
    try {
      const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (error) {
        setNotice({ ok: false, text: error.status === 429 ? "시도가 너무 많습니다. 잠시 뒤 다시 시도해 주세요." : "현재 비밀번호를 확인해 주세요." });
      } else {
        formEl.reset();
        setNotice({ ok: true, text: "비밀번호를 바꿨습니다. 다른 기기의 로그인은 모두 해제되었습니다." });
      }
    } catch {
      setNotice({ ok: false, text: "서버에 연결하지 못했습니다." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:max-w-sm">
      <div>
        <Label htmlFor="current">현재 비밀번호</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required maxLength={LIMITS.passwordMax} />
      </div>
      <div>
        <Label htmlFor="next">새 비밀번호 ({LIMITS.passwordMin}자 이상)</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" required minLength={LIMITS.passwordMin} maxLength={LIMITS.passwordMax} />
      </div>
      <div>
        <Label htmlFor="confirm">새 비밀번호 확인</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required maxLength={LIMITS.passwordMax} />
      </div>
      {notice && (
        <p role={notice.ok ? "status" : "alert"} className={notice.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {notice.text}
        </p>
      )}
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending && <Loader2 className="animate-spin" />}
        비밀번호 변경
      </Button>
    </form>
  );
}
