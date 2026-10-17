import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiaryEditor } from "@/components/diary/diary-editor";
import { getDiary } from "@/lib/data/diaries";
import { formatKoreanDate } from "@/lib/date";
import { idSchema } from "@/lib/validation";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  return idSchema.safeParse(id).success ? getDiary(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const diary = await load((await params).id);
  return { title: diary ? diary.title || formatKoreanDate(diary.diaryDate, false) : "일기" };
}

export default async function DiaryPage({ params }: Props) {
  const diary = await load((await params).id);
  if (!diary) notFound();
  return (
    <DiaryEditor
      key={diary.id}
      id={diary.id}
      isNew={false}
      deleted={diary.deletedAt !== null}
      createdAt={diary.createdAt.toISOString()}
      updatedAt={diary.updatedAt.toISOString()}
      initial={{
        title: diary.title,
        content: diary.content,
        diaryDate: diary.diaryDate,
        mood: diary.mood,
        weather: diary.weather,
        isFavorite: diary.isFavorite,
        tags: diary.tags,
      }}
    />
  );
}
