import { BookHeart, ChevronLeft, ChevronRight, PenLine, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DiaryCard } from "@/components/diary/diary-card";
import { Pagination } from "@/components/shared/pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { LIMITS } from "@/lib/constants";
import { diaryCountsByMonth, listDiaries } from "@/lib/data/diaries";
import { formatMonthLabel, isValidMonthString, todayKst } from "@/lib/date";
import { buildQuery, cn, firstParam, parsePage, type SearchParams } from "@/lib/utils";

export const metadata: Metadata = { title: "일기" };

export default async function DiaryListPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim().slice(0, LIMITS.query) || undefined;
  const monthRaw = firstParam(sp.month);
  const month = monthRaw && isValidMonthString(monthRaw) ? monthRaw : undefined;
  const thisYear = Number(todayKst().slice(0, 4));
  const yearRaw = Number(firstParam(sp.year));
  const year = month ? Number(month.slice(0, 4)) : yearRaw >= 1900 && yearRaw <= 2200 ? yearRaw : thisYear;
  const page = parsePage(firstParam(sp.page));

  const [{ items, total, totalPages }, counts] = await Promise.all([listDiaries({ q, month, page }), diaryCountsByMonth(year)]);
  const yearTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const filtering = Boolean(q || month);

  return (
    <div>
      <PageHeader
        title="일기"
        description={month ? `${formatMonthLabel(month)}의 일기 ${total}편` : q ? `검색 결과 ${total}편` : `일기 ${total}편`}
        actions={
          <>
            <Link href="/diary/calendar" className={buttonVariants({ variant: "outline" })}>
              캘린더
            </Link>
            <Link href="/diary/new" className={buttonVariants()}>
              <PenLine /> 일기 쓰기
            </Link>
          </>
        }
      />

      <section className="mb-5 rounded-xl border bg-card p-4" aria-label="월별 일기 수">
        <div className="mb-3 flex items-center justify-between">
          <Link href={`/diary${buildQuery({ year: year - 1, q })}`} aria-label="이전 해" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <ChevronLeft />
          </Link>
          <p className="text-sm font-medium">
            {year}년 <span className="text-muted-foreground">· {yearTotal}편</span>
          </p>
          <Link href={`/diary${buildQuery({ year: year + 1, q })}`} aria-label="다음 해" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
            <ChevronRight />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-12">
          {Array.from({ length: 12 }, (_, i) => {
            const ym = `${year}-${String(i + 1).padStart(2, "0")}`;
            const count = counts[ym] ?? 0;
            const active = month === ym;
            return (
              <Link
                key={ym}
                href={active ? `/diary${buildQuery({ year, q })}` : `/diary${buildQuery({ month: ym, q })}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex flex-col items-center rounded-lg py-1.5 text-xs transition-colors",
                  active ? "bg-primary text-primary-foreground" : count ? "bg-accent text-accent-foreground hover:bg-accent/70" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {i + 1}월<span className="mt-0.5 font-semibold tabular-nums">{count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <form method="get" className="mb-5 flex gap-2">
        {month && <input type="hidden" name="month" value={month} />}
        <Input name="q" defaultValue={q} placeholder="일기 내용 검색" aria-label="일기 검색" maxLength={LIMITS.query} />
        <Button type="submit" variant="secondary">
          검색
        </Button>
        {filtering && (
          <Link href="/diary" className={buttonVariants({ variant: "ghost" })}>
            초기화
          </Link>
        )}
      </form>

      {items.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((d) => (
            <DiaryCard key={d.id} diary={d} />
          ))}
        </div>
      ) : filtering ? (
        <EmptyState icon={SearchX} title="해당하는 일기가 없어요" description="다른 달을 고르거나 검색어를 바꿔 보세요." />
      ) : (
        <EmptyState
          icon={BookHeart}
          title="아직 쓴 일기가 없어요"
          description="오늘이 첫 페이지가 되기에 좋은 날이에요."
          action={
            <Link href="/diary/new" className={buttonVariants({ size: "sm" })}>
              오늘의 일기 쓰기
            </Link>
          }
        />
      )}

      <Pagination basePath="/diary" page={page} totalPages={totalPages} params={{ q, month }} />
    </div>
  );
}
