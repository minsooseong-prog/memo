import Link from "next/link";
import { MOOD_META, type Mood } from "@/lib/constants";
import { addDays, monthRange, weekdayOf } from "@/lib/date";
import { cn } from "@/lib/utils";

export type CalendarEntry = { id: string; mood: Mood };

const HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarGrid({
  month,
  today,
  selected,
  entriesByDate,
}: {
  month: string;
  today: string;
  selected: string | null;
  entriesByDate: Record<string, CalendarEntry[]>;
}) {
  const { start, end } = monthRange(month);
  const cells: (string | null)[] = [
    ...Array.from({ length: weekdayOf(start) }, () => null),
    ...Array.from({ length: Number(end.slice(8)) }, (_, i) => addDays(start, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b text-center text-xs text-muted-foreground">
        {HEADERS.map((h, i) => (
          <div key={h} className={cn("py-2", i === 0 && "text-destructive")}>
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} className="min-h-16 border-b border-r bg-muted/30 sm:min-h-24" />;
          const entries = entriesByDate[date] ?? [];
          const day = Number(date.slice(8));
          const isSelected = date === selected;
          return (
            <Link
              key={date}
              href={`/diary/calendar?month=${month}&date=${date}`}
              scroll={false}
              aria-label={`${day}일${entries.length ? `, 일기 ${entries.length}편` : ""}`}
              aria-current={isSelected ? "date" : undefined}
              className={cn(
                "flex min-h-16 flex-col gap-1 border-b border-r p-1.5 transition-colors sm:min-h-24 sm:p-2",
                isSelected ? "bg-accent" : "hover:bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs sm:size-7 sm:text-sm",
                  date === today && "bg-primary font-semibold text-primary-foreground",
                  date !== today && i % 7 === 0 && "text-destructive",
                )}
              >
                {day}
              </span>
              {entries.length > 0 && (
                <span className="flex flex-wrap items-center gap-0.5 text-sm leading-none sm:text-lg">
                  {entries.slice(0, 3).map((e) => (
                    <span key={e.id} role="img" aria-label={MOOD_META[e.mood].label}>
                      {MOOD_META[e.mood].emoji}
                    </span>
                  ))}
                  {entries.length > 3 && <span className="text-[0.65rem] text-muted-foreground">+{entries.length - 3}</span>}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
