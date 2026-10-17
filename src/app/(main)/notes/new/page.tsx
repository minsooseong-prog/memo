import type { Metadata } from "next";
import { NoteEditor } from "@/components/notes/note-editor";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "새 메모" };

export default async function NewNotePage() {
  await requireUser();
  // 서버가 id 를 미리 발급 → 자동 저장이 여러 번 일어나도 메모가 하나만 생깁니다.
  const id = crypto.randomUUID();
  return (
    <NoteEditor
      key={id}
      id={id}
      isNew
      deleted={false}
      createdAt={null}
      updatedAt={null}
      initial={{ title: "", content: "", isPinned: false, isFavorite: false, tags: [] }}
    />
  );
}
