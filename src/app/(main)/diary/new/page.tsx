import type { Metadata } from "next";
import { DiaryEditor } from "@/components/diary/diary-editor";
import { isValidDateString, todayKst } from "@/lib/date";
import { requireUser } from "@/lib/session";
import { firstParam, type SearchParams } from "@/lib/utils";

export const metadata: Metadata = { title: "일기 쓰기" };

export default async function NewDiaryPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const raw = firstParam((await searchParams).date);
  const date = raw && isValidDateString(raw) ? raw : todayKst();
  const id = crypto.randomUUID();
  return (
    <DiaryEditor
      key={id}
      id={id}
      isNew
      deleted={false}
      createdAt={null}
      updatedAt={null}
      initial={{ title: "", content: "", diaryDate: date, mood: null, weather: null, isFavorite: false, tags: [] }}
    />
  );
}
