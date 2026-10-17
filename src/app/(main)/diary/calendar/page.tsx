import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarGrid, type CalendarEntry } from "@/components/diary/calendar-grid";
import { buttonVariants } from "@/components/ui/button";
import { MOOD_META, WEATHER_META } from "@/lib/constants";
import { getMonthDiaries } from "@/lib/data/diaries";
import { formatKoreanDate, formatMonthLabel, isValidDateString, isValidMonthString, shiftMonth, todayKst } from "@/lib/date";
import { displayTitle } from "@/lib/text";
import { firstParam, type SearchParams } from "@/lib/utils";

export const metadata: Metadata = { title: "일기 캘린더" };

export default async function DiaryCalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const today = todayKst();
  const monthRaw = firstParam(sp.month);
  const month = monthRaw && isValidMonthString(monthRaw) ? monthRaw : today.slice(0, 7);
  const dateRaw = firstParam(sp.date);
  const selected = dateRaw && isValidDateString(dateRaw) && dateRaw.startsWith(month) ? dateRaw : today.startsWith(month) ? today : null;

  const rows = await getMonthDiaries(month);
  const entriesByDate: Record<string, CalendarEntry[]> = {};
  for (const r of rows) (entriesByDate[r.diaryDate] ??= []).push({ id: r.id, mood: r.mood });
  const selectedRows = selected ? rows.filter((r) => r.diaryDate === selected) : [];
  const nav = buttonVariants({ variant: "outline", size: "icon" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{formatMonthLabel(month)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">이번 달 일기 {rows.length}편</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/diary/calendar?month=${shiftMonth(month, -1)}`} aria-label="이전 달" className={nav}>
            <ChevronLeft />
          </Link>
          {month !== today.slice(0, 7) && (
            <Link href="/diary/calendar" className={buttonVariants({ variant: "outline" })}>
              오늘
            </Link>
          )}
          <Link href={`/diary/calendar?month=${shiftMonth(month, 1)}`} aria-label="다음 달" className={nav}>
            <ChevronRight />
          </Link>
        </div>
      </div>

      <CalendarGrid month={month} today={today} selected={selected} entriesByDate={entriesByDate} />

      {selected && (
        <section className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-semibold">{formatKoreanDate(selected)}</h2>
            <Link href={`/diary/new?date=${selected}`} className={buttonVariants({ size: "sm" })}>
              <PenLine /> 이 날의 일기 쓰기
            </Link>
          </div>
          {selectedRows.length ? (
            <ul className="mt-3 divide-y">
              {selectedRows.map((r) => (
                <li key={r.id}>
                  <Link href={`/diary/${r.id}`} className="flex items-center gap-3 py-3 hover:text-primary">
                    <span className="text-xl" role="img" aria-label={MOOD_META[r.mood].label}>
                      {MOOD_META[r.mood].emoji}
                    </span>
                    <span className="flex-1 truncate font-serif">{displayTitle(r.title, `${MOOD_META[r.mood].label}한 하루`)}</span>
                    {r.weather && <span aria-label={WEATHER_META[r.weather].label}>{WEATHER_META[r.weather].emoji}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">이 날에는 아직 일기가 없어요.</p>
          )}
        </section>
      )}
    </div>
  );
}
