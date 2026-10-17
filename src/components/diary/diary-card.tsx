import { Star } from "lucide-react";
import Link from "next/link";
import { DateLeaf } from "@/components/shared/date-leaf";
import { MOOD_META, WEATHER_META } from "@/lib/constants";
import { displayTitle, toExcerpt } from "@/lib/text";
import type { DiarySummary } from "@/types/records";
import { diaryHref } from "@/lib/routes";

export function DiaryCard({ diary }: { diary: DiarySummary }) {
  const mood = MOOD_META[diary.mood];
  const weather = diary.weather ? WEATHER_META[diary.weather] : null;
  return (
    <Link
      href={diaryHref(diary.id)}
      className="group flex gap-4 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <DateLeaf date={diary.diaryDate} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span role="img" aria-label={`기분 ${mood.label}`} className="text-base">
            {mood.emoji}
          </span>
          {weather && (
            <span role="img" aria-label={`날씨 ${weather.label}`} className="text-sm opacity-80">
              {weather.emoji}
            </span>
          )}
          <span className="truncate font-serif font-semibold">{displayTitle(diary.title, `${mood.label}한 하루`)}</span>
          {diary.isFavorite && <Star aria-label="즐겨찾기" className="size-3.5 shrink-0 fill-highlight text-highlight" />}
        </div>
        <p className="mt-1 line-clamp-2 font-serif text-sm leading-6 text-muted-foreground">{toExcerpt(diary.content, 140) || "내용 없음"}</p>
        {diary.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {diary.tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded bg-accent px-1.5 py-0.5 text-[0.7rem] text-accent-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
