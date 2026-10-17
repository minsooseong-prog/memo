import { weekdayLabel } from "@/lib/date";
import { cn } from "@/lib/utils";

/** 일력(日曆) 한 장 모양의 날짜 표시 — 일기 기록을 상징하는 요소 */
export function DateLeaf({ date, size = "md", className }: { date: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const [, m, d] = date.split("-").map(Number);
  const day = weekdayLabel(date);
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-lg border bg-card text-center shadow-xs",
        size === "sm" && "w-10",
        size === "md" && "w-12",
        size === "lg" && "w-16",
        className,
      )}
    >
      <span className={cn("bg-primary font-medium text-primary-foreground", size === "lg" ? "py-0.5 text-xs" : "text-[0.6rem] leading-4")}>
        {m}월
      </span>
      <span className={cn("font-serif font-semibold leading-none", size === "sm" ? "pt-1 text-base" : size === "md" ? "pt-1.5 text-xl" : "pt-2 text-3xl")}>
        {d}
      </span>
      <span className={cn("pb-1 text-muted-foreground", size === "lg" ? "pt-1 text-xs" : "text-[0.6rem]")}>
        <span className={cn(day === "일" && "text-destructive")}>{day}</span>
      </span>
    </div>
  );
}
