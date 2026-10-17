import { NotebookPen, Plus, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NoteCollection } from "@/components/notes/note-item";
import { Pagination } from "@/components/shared/pagination";
import { ViewToggle } from "@/components/shared/view-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { LIMITS, NOTE_SORTS, type NoteSort } from "@/lib/constants";
import { listNotes } from "@/lib/data/notes";
import { listActiveTags } from "@/lib/data/tags";
import { firstParam, parsePage, type SearchParams } from "@/lib/utils";
import { noteSortSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "메모" };

export default async function NotesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim().slice(0, LIMITS.query) || undefined;
  const tag = firstParam(sp.tag)?.trim().slice(0, LIMITS.tagName) || undefined;
  const sort = noteSortSchema.parse(firstParam(sp.sort)) as NoteSort;
  const view = firstParam(sp.view) === "list" ? "list" : "card";
  const page = parsePage(firstParam(sp.page));

  const [{ items, total, totalPages }, tags] = await Promise.all([listNotes({ q, tag, sort, page }), listActiveTags()]);
  const filtering = Boolean(q || tag);
  const params = { q, tag, sort: sort === "latest" ? undefined : sort, view: view === "list" ? "list" : undefined };

  return (
    <div>
      <PageHeader
        title="메모"
        description={filtering ? `조건에 맞는 메모 ${total}개` : `메모 ${total}개`}
        actions={
          <Link href="/notes/new" className={buttonVariants()}>
            <Plus /> 새 메모
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <form method="get" className="flex flex-1 flex-wrap gap-2">
          <Input name="q" defaultValue={q} placeholder="제목·본문 검색" aria-label="메모 검색" className="min-w-40 flex-1" maxLength={LIMITS.query} />
          <Select name="tag" defaultValue={tag ?? ""} aria-label="태그" className="w-auto">
            <option value="">모든 태그</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </Select>
          <Select name="sort" defaultValue={sort} aria-label="정렬" className="w-auto">
            {NOTE_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          {view === "list" && <input type="hidden" name="view" value="list" />}
          <Button type="submit" variant="secondary">
            적용
          </Button>
          {filtering && (
            <Link href={`/notes${view === "list" ? "?view=list" : ""}`} className={buttonVariants({ variant: "ghost" })}>
              초기화
            </Link>
          )}
        </form>
        <ViewToggle basePath="/notes" view={view} params={params} />
      </div>

      {items.length ? (
        <NoteCollection notes={items} view={view} />
      ) : filtering ? (
        <EmptyState icon={SearchX} title="찾는 메모가 없어요" description="다른 단어로 검색하거나 태그 필터를 풀어 보세요." />
      ) : (
        <EmptyState
          icon={NotebookPen}
          title="빈 메모장이에요"
          description="생각이 떠오를 때 바로 적어 두면, 나중의 내가 고마워할 거예요."
          action={
            <Link href="/notes/new" className={buttonVariants({ size: "sm" })}>
              첫 메모 쓰기
            </Link>
          }
        />
      )}

      <Pagination basePath="/notes" page={page} totalPages={totalPages} params={params} />
    </div>
  );
}
