import "server-only";
import { and, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { diaries, notes } from "@/db/schema";
import { todayKst } from "../date";
import { requireUser } from "../session";
import { diaryColumns, withDiaryTags } from "./diaries";
import { noteColumns, withNoteTags } from "./notes";

export type Activity = {
  kind: "note" | "diary";
  id: string;
  title: string;
  action: "created" | "updated" | "trashed";
  at: Date;
  diaryDate?: string;
};

function toAction(row: { createdAt: Date; updatedAt: Date; deletedAt: Date | null }): Activity["action"] {
  if (row.deletedAt) return "trashed";
  return row.updatedAt.getTime() - row.createdAt.getTime() < 60_000 ? "created" : "updated";
}

export async function getDashboard() {
  const user = await requireUser();
  const db = getDb();
  const noteActive = and(eq(notes.userId, user.id), isNull(notes.deletedAt));
  const diaryActive = and(eq(diaries.userId, user.id), isNull(diaries.deletedAt));
  const noteActivityAt = sql<Date>`coalesce(${notes.deletedAt}, ${notes.updatedAt})`;
  const diaryActivityAt = sql<Date>`coalesce(${diaries.deletedAt}, ${diaries.updatedAt})`;
  const today = todayKst();

  const [noteTotal, diaryTotal, todayDiaries, recentNotes, recentDiaries, favNotes, favDiaries, noteActs, diaryActs] =
    await Promise.all([
      db.select({ value: count() }).from(notes).where(noteActive),
      db.select({ value: count() }).from(diaries).where(diaryActive),
      db.select({ value: count() }).from(diaries).where(and(diaryActive, eq(diaries.diaryDate, today))),
      db.select(noteColumns).from(notes).where(noteActive).orderBy(desc(notes.updatedAt)).limit(4),
      db.select(diaryColumns).from(diaries).where(diaryActive).orderBy(desc(diaries.diaryDate), desc(diaries.createdAt)).limit(3),
      db
        .select({ id: notes.id, title: notes.title, updatedAt: notes.updatedAt })
        .from(notes)
        .where(and(noteActive, eq(notes.isFavorite, true)))
        .orderBy(desc(notes.updatedAt))
        .limit(5),
      db
        .select({ id: diaries.id, title: diaries.title, diaryDate: diaries.diaryDate, updatedAt: diaries.updatedAt })
        .from(diaries)
        .where(and(diaryActive, eq(diaries.isFavorite, true)))
        .orderBy(desc(diaries.updatedAt))
        .limit(5),
      db
        .select({ id: notes.id, title: notes.title, createdAt: notes.createdAt, updatedAt: notes.updatedAt, deletedAt: notes.deletedAt })
        .from(notes)
        .where(eq(notes.userId, user.id))
        .orderBy(desc(noteActivityAt))
        .limit(8),
      db
        .select({
          id: diaries.id,
          title: diaries.title,
          diaryDate: diaries.diaryDate,
          createdAt: diaries.createdAt,
          updatedAt: diaries.updatedAt,
          deletedAt: diaries.deletedAt,
        })
        .from(diaries)
        .where(eq(diaries.userId, user.id))
        .orderBy(desc(diaryActivityAt))
        .limit(8),
    ]);

  const activity: Activity[] = [
    ...noteActs.map((r) => ({ kind: "note" as const, id: r.id, title: r.title, action: toAction(r), at: r.deletedAt ?? r.updatedAt })),
    ...diaryActs.map((r) => ({
      kind: "diary" as const,
      id: r.id,
      title: r.title,
      action: toAction(r),
      at: r.deletedAt ?? r.updatedAt,
      diaryDate: r.diaryDate,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  const favorites = [
    ...favNotes.map((r) => ({ kind: "note" as const, id: r.id, title: r.title, at: r.updatedAt })),
    ...favDiaries.map((r) => ({ kind: "diary" as const, id: r.id, title: r.title, at: r.updatedAt, diaryDate: r.diaryDate })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  return {
    user,
    today,
    noteCount: noteTotal[0]?.value ?? 0,
    diaryCount: diaryTotal[0]?.value ?? 0,
    wroteToday: (todayDiaries[0]?.value ?? 0) > 0,
    recentNotes: await withNoteTags(recentNotes),
    recentDiaries: await withDiaryTags(recentDiaries),
    favorites,
    activity,
  };
}

export async function getFavorites() {
  const user = await requireUser();
  const db = getDb();
  const [noteRows, diaryRows] = await Promise.all([
    db
      .select(noteColumns)
      .from(notes)
      .where(and(eq(notes.userId, user.id), isNull(notes.deletedAt), eq(notes.isFavorite, true)))
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt)),
    db
      .select(diaryColumns)
      .from(diaries)
      .where(and(eq(diaries.userId, user.id), isNull(diaries.deletedAt), eq(diaries.isFavorite, true)))
      .orderBy(desc(diaries.diaryDate), desc(diaries.createdAt)),
  ]);
  return { notes: await withNoteTags(noteRows), diaries: await withDiaryTags(diaryRows) };
}

export async function getTrash() {
  const user = await requireUser();
  const db = getDb();
  const [noteRows, diaryRows] = await Promise.all([
    db
      .select({ id: notes.id, title: notes.title, content: notes.content, deletedAt: notes.deletedAt })
      .from(notes)
      .where(and(eq(notes.userId, user.id), isNotNull(notes.deletedAt)))
      .orderBy(desc(notes.deletedAt)),
    db
      .select({ id: diaries.id, title: diaries.title, content: diaries.content, diaryDate: diaries.diaryDate, deletedAt: diaries.deletedAt })
      .from(diaries)
      .where(and(eq(diaries.userId, user.id), isNotNull(diaries.deletedAt)))
      .orderBy(desc(diaries.deletedAt)),
  ]);
  return { notes: noteRows, diaries: diaryRows };
}
