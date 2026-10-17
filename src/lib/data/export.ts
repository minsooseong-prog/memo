import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { diaries, notes } from "@/db/schema";
import type { ExportDiary, ExportNote } from "../export-format";
import { diaryColumns, withDiaryTags } from "./diaries";
import { noteColumns, withNoteTags } from "./notes";

// 내보내기는 API 라우트에서 세션을 확인한 뒤 userId 를 넘겨 호출합니다(401 응답을 위해).

export async function exportAll(userId: string) {
  const db = getDb();
  const [noteRows, diaryRows] = await Promise.all([
    db
      .select({ ...noteColumns, deletedAt: notes.deletedAt })
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(asc(notes.createdAt)),
    db
      .select({ ...diaryColumns, deletedAt: diaries.deletedAt })
      .from(diaries)
      .where(eq(diaries.userId, userId))
      .orderBy(asc(diaries.diaryDate), asc(diaries.createdAt)),
  ]);
  const [n, d] = await Promise.all([withNoteTags(noteRows), withDiaryTags(diaryRows)]);
  return {
    app: "my-archive",
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: n.map((r) => ({ ...r, inTrash: r.deletedAt !== null })),
    diaries: d.map((r) => ({ ...r, inTrash: r.deletedAt !== null })),
  };
}

export async function exportNote(userId: string, id: string): Promise<ExportNote | null> {
  const rows = await getDb()
    .select(noteColumns)
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .limit(1);
  if (!rows[0]) return null;
  return (await withNoteTags(rows))[0] ?? null;
}

export async function exportDiary(userId: string, id: string): Promise<ExportDiary | null> {
  const rows = await getDb()
    .select(diaryColumns)
    .from(diaries)
    .where(and(eq(diaries.id, id), eq(diaries.userId, userId)))
    .limit(1);
  if (!rows[0]) return null;
  return (await withDiaryTags(rows))[0] ?? null;
}
