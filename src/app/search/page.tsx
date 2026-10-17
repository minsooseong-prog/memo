import { BookHeart, NotebookPen, Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/surface";
import { Input, Label, Select } from "@/components/ui/input";
import { LIMITS, MOOD_META, SEARCH_TYPES } from "@/lib/constants";
import { searchRecords, type SearchFilters } from "@/lib/data/search";
import { listActiveTags } from "@/lib/data/tags";
import { formatKoreanDate } from "@/lib/date";
import { displayTitle, toExcerpt } from "@/lib/text";
import { firstParam, type SearchParams } from "@/lib/utils";
import { searchQuerySchema } from "@/lib/validation";
import { recordHref } from "@/lib/routes";

export const metadata: Metadata = { title: "검색" };

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters: SearchFilters = searchQuerySchema.parse({
    q: firstParam(sp.q),
    type: firstParam(sp.type),
    tag: firstParam(sp.tag),
    from: firstParam(sp.from) || undefined,
    to: firstParam(sp.to) || undefined,
    sort: firstParam(sp.sort),
  }) as SearchFilters;
  const hasCriteria = Boolean(filters.q || filters.tag || filters.from || filters.to);
  const [tags, hits] = await Promise.all([listActiveTags(), hasCriteria ? searchRecords(filters) : Promise.resolve([])]);

  return (
    <div>
      <PageHeader title="검색" description="메모와 일기를 한 번에 찾습니다." />

      <form method="get" className="mb-6 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-6">
          <Label htmlFor="q">검색어</Label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="q" name="q" defaultValue={filters.q} placeholder="제목이나 본문에 들어간 단어" className="pl-9" maxLength={LIMITS.query} autoFocus={!hasCriteria} />
          </div>
        </div>
        <div>
          <Label htmlFor="type">종류</Label>
          <Select id="type" name="type" defaultValue={filters.type}>
            {SEARCH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="tag">태그</Label>
          <Select id="tag" name="tag" defaultValue={filters.tag ?? ""}>
            <option value="">전체</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="from">시작 날짜</Label>
          <Input id="from" name="from" type="date" defaultValue={filters.from} />
        </div>
        <div>
          <Label htmlFor="to">끝 날짜</Label>
          <Input id="to" name="to" type="date" defaultValue={filters.to} />
        </div>
        <div>
          <Label htmlFor="sort">정렬</Label>
          <Select id="sort" name="sort" defaultValue={filters.sort}>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="title">제목순</option>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">
            검색
          </Button>
          {hasCriteria && (
            <Link href="/search" className={buttonVariants({ variant: "ghost" })}>
              초기화
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-6">날짜 범위는 메모는 수정한 날, 일기는 일기 날짜를 기준으로 합니다.</p>
      </form>

      {!hasCriteria ? (
        <EmptyState icon={Search} title="무엇을 찾고 있나요?" description="검색어, 태그, 날짜 중 하나 이상을 입력해 보세요." />
      ) : hits.length === 0 ? (
        <EmptyState icon={SearchX} title="결과가 없어요" description="단어를 줄이거나 날짜 범위를 넓혀 보세요." />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">결과 {hits.length}개</p>
          <ul className="divide-y rounded-xl border bg-card">
            {hits.map((hit) => (
              <li key={`${hit.kind}-${hit.id}`}>
                <Link href={recordHref(hit.kind, hit.id)} className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                  {hit.kind === "note" ? (
                    <NotebookPen aria-label="메모" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <BookHeart aria-label="일기" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {hit.mood && <span aria-hidden>{MOOD_META[hit.mood].emoji}</span>}
                      <span className="truncate font-medium">{displayTitle(hit.title, hit.kind === "diary" ? "제목 없는 일기" : "제목 없음")}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{toExcerpt(hit.content, 160) || "내용 없음"}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatKoreanDate(hit.date, false)}</span>
                      {hit.tags.slice(0, 4).map((t) => (
                        <span key={t} className="rounded bg-accent px-1.5 py-0.5 text-accent-foreground">
                          #{t}
                        </span>
                      ))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
