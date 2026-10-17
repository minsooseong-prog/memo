import { BookHeart, NotebookPen, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyTrashButton, TrashItemActions } from "@/components/shared/trash-actions";
import { EmptyState, PageHeader } from "@/components/ui/surface";
import { getTrash } from "@/lib/data/overview";
import { formatRelativeShort } from "@/lib/date";
import { displayTitle, toExcerpt } from "@/lib/text";
import { recordHref } from "@/lib/routes";

export const metadata: Metadata = { title: "휴지통" };

export default async function TrashPage() {
  const { notes, diaries } = await getTrash();
  const items = [
    ...notes.map((n) => ({ kind: "note" as const, id: n.id, title: displayTitle(n.title), content: n.content, deletedAt: n.deletedAt })),
    ...diaries.map((d) => ({ kind: "diary" as const, id: d.id, title: displayTitle(d.title, `${d.diaryDate} 일기`), content: d.content, deletedAt: d.deletedAt })),
  ].sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0));

  return (
    <div>
      <PageHeader title="휴지통" description="삭제한 기록은 영구 삭제하기 전까지 여기에 보관됩니다." actions={<EmptyTrashButton count={items.length} />} />
      {items.length === 0 ? (
        <EmptyState icon={Trash2} title="휴지통이 비어 있어요" description="삭제한 메모와 일기는 여기에서 복원할 수 있습니다." />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <Link href={recordHref(item.kind, item.id)} className="flex min-w-0 flex-1 items-start gap-3">
                {item.kind === "note" ? <NotebookPen className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <BookHeart className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">{toExcerpt(item.content, 90) || "내용 없음"}</span>
                  {item.deletedAt && <span className="text-xs text-muted-foreground">삭제 {formatRelativeShort(item.deletedAt)}</span>}
                </span>
              </Link>
              <TrashItemActions kind={item.kind} id={item.id} title={item.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
