"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { unlockAction, type UnlockState } from "@/actions/lock";
import { Button } from "@/components/ui/button";

const initialState: UnlockState = {};

export function UnlockForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(unlockAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <input type="hidden" name="next" value={next} />
      <input
        name="pin"
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoFocus
        required
        maxLength={12}
        aria-label="잠금 비밀번호"
        placeholder="••••••"
        className="h-14 w-full rounded-xl border border-input bg-card text-center text-2xl tracking-[0.5em] shadow-xs outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
      />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        열기
      </Button>
    </form>
  );
}
