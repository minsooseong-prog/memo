import { Star } from "lucide-react";
import type { Metadata } from "next";
import { DiaryCard } from "@/components/diary/diary-card";
import { NoteCollection } from "@/components/notes/note-item";
import { EmptyState, PageHeader } from "@/components/ui/surface";
import { getFavorites } from "@/lib/data/overview";

export const metadata: Metadata = { title: "즐겨찾기" };

export default async function FavoritesPage() {
  const { notes, diaries } = await getFavorites();
  const empty = notes.length === 0 && diaries.length === 0;

  return (
    <div>
      <PageHeader title="즐겨찾기" description="별표를 누른 메모와 일기를 모아 봅니다." />
      {empty ? (
        <EmptyState icon={Star} title="아직 즐겨찾기가 없어요" description="오래 간직하고 싶은 기록에서 별표를 눌러 보세요." />
      ) : (
        <div className="space-y-8">
          {notes.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">메모 {notes.length}</h2>
              <NoteCollection notes={notes} view="card" />
            </section>
          )}
          {diaries.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold">일기 {diaries.length}</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {diaries.map((d) => (
                  <DiaryCard key={d.id} diary={d} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
