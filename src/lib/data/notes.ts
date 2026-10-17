import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { notes } from "@/db/schema";
import type { NoteSummary } from "@/types/records";
import { PAGE_SIZE, type NoteSort } from "../constants";
import { requireUser } from "../session";
import { escapeLike } from "../text";
import { noteIdsWithTag, tagsForNotes } from "./tags";

export const noteColumns = {
  id: notes.id,
  title: notes.title,
  content: notes.content,
  isPinned: notes.isPinned,
  isFavorite: notes.isFavorite,
  createdAt: notes.createdAt,
  updatedAt: notes.updatedAt,
};

export async function withNoteTags<T extends { id: string }>(rows: T[]): Promise<(T & { tags: string[] })[]> {
  const map = await tagsForNotes(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, tags: map.get(r.id) ?? [] }));
}

export type NoteListOptions = { q?: string; tag?: string; sort: NoteSort; page: number; favoritesOnly?: boolean };

export async function listNotes(options: NoteListOptions): Promise<{ items: NoteSummary[]; total: number; totalPages: number }> {
  const user = await requireUser();
  const conditions: SQL[] = [eq(notes.userId, user.id), isNull(notes.deletedAt)];
  if (options.q) {
    const pattern = `%${escapeLike(options.q)}%`;
    const match = or(ilike(notes.title, pattern), ilike(notes.content, pattern));
    if (match) conditions.push(match);
  }
  if (options.tag) conditions.push(inArray(notes.id, noteIdsWithTag(user.id, options.tag)));
  if (options.favoritesOnly) conditions.push(eq(notes.isFavorite, true));
  const where = and(...conditions);

  const order =
    options.sort === "oldest"
      ? [asc(notes.createdAt)]
      : options.sort === "title"
        ? [asc(notes.title), desc(notes.updatedAt)]
        : [desc(notes.updatedAt)];

  const db = getDb();
  const [rows, totalRows] = await Promise.all([
    db
      .select(noteColumns)
      .from(notes)
      .where(where)
      .orderBy(desc(notes.isPinned), ...order)
      .limit(PAGE_SIZE)
      .offset((options.page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(notes).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;
  return { items: await withNoteTags(rows), total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** 편집 화면용: 휴지통 상태 포함, 본인 소유만 */
export async function getNote(id: string) {
  const user = await requireUser();
  const rows = await getDb()
    .select({ ...noteColumns, deletedAt: notes.deletedAt })
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const [withTags] = await withNoteTags([row]);
  return withTags;
}
