import { AlertCircle, Check, CloudOff, Loader2 } from "lucide-react";
import type { AutosaveStatus } from "@/lib/hooks/use-autosave";
import { cn } from "@/lib/utils";

const base = "flex items-center gap-1.5 text-xs";

export function SaveStatus({ status, message, onRetry }: { status: AutosaveStatus; message: string | null; onRetry: () => void }) {
  if (status === "saving")
    return (
      <span className={cn(base, "text-muted-foreground")} aria-live="polite">
        <Loader2 className="size-3.5 animate-spin" /> 저장 중
      </span>
    );
  if (status === "saved")
    return (
      <span className={cn(base, "text-primary")} aria-live="polite">
        <Check className="size-3.5" /> 저장됨
      </span>
    );
  if (status === "pending")
    return (
      <span className={cn(base, "text-muted-foreground")} aria-live="polite">
        <span className="size-1.5 rounded-full bg-highlight" /> 변경됨
      </span>
    );
  if (status === "blocked")
    return (
      <span className={cn(base, "text-muted-foreground")} aria-live="polite">
        {message}
      </span>
    );
  if (status === "error")
    return (
      <span className={cn(base, "text-destructive")} role="alert">
        {message?.includes("오프라인") ? <CloudOff className="size-3.5 shrink-0" /> : <AlertCircle className="size-3.5 shrink-0" />}
        <span className="line-clamp-2">{message}</span>
        <button type="button" onClick={onRetry} className="shrink-0 cursor-pointer font-medium underline underline-offset-2">
          다시 저장
        </button>
      </span>
    );
  return null;
}
