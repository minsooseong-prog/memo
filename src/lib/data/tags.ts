import "server-only";
import { and, asc, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { getDb, type Tx } from "@/db";
import { diaries, diaryTags, noteTags, notes, tags } from "@/db/schema";
import { requireUser } from "../session";

async function ensureTagIds(tx: Tx, userId: string, names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  await tx
    .insert(tags)
    .values(names.map((name) => ({ userId, name })))
    .onConflictDoNothing({ target: [tags.userId, tags.name] });
  const rows = await tx
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, names)));
  return rows.map((r) => r.id);
}

/** 어떤 기록에도 연결되지 않은 태그를 정리합니다. */
export async function deleteOrphanTags(tx: Tx, userId: string): Promise<void> {
  await tx
    .delete(tags)
    .where(
      and(
        eq(tags.userId, userId),
        sql`NOT EXISTS (SELECT 1 FROM ${noteTags} WHERE ${noteTags.tagId} = ${tags.id})`,
        sql`NOT EXISTS (SELECT 1 FROM ${diaryTags} WHERE ${diaryTags.tagId} = ${tags.id})`,
      ),
    );
}

export async function syncNoteTags(tx: Tx, userId: string, noteId: string, names: string[]): Promise<void> {
  const ids = await ensureTagIds(tx, userId, names);
  await tx
    .delete(noteTags)
    .where(ids.length ? and(eq(noteTags.noteId, noteId), notInArray(noteTags.tagId, ids)) : eq(noteTags.noteId, noteId));
  if (ids.length) {
    await tx
      .insert(noteTags)
      .values(ids.map((tagId) => ({ noteId, tagId })))
      .onConflictDoNothing();
  }
  await deleteOrphanTags(tx, userId);
}

export async function syncDiaryTags(tx: Tx, userId: string, diaryId: string, names: string[]): Promise<void> {
  const ids = await ensureTagIds(tx, userId, names);
  await tx
    .delete(diaryTags)
    .where(
      ids.length ? and(eq(diaryTags.diaryId, diaryId), notInArray(diaryTags.tagId, ids)) : eq(diaryTags.diaryId, diaryId),
    );
  if (ids.length) {
    await tx
      .insert(diaryTags)
      .values(ids.map((tagId) => ({ diaryId, tagId })))
      .onConflictDoNothing();
  }
  await deleteOrphanTags(tx, userId);
}

function group(rows: { recordId: string; name: string }[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const list = map.get(r.recordId);
    if (list) list.push(r.name);
    else map.set(r.recordId, [r.name]);
  }
  return map;
}

export async function tagsForNotes(noteIds: string[]): Promise<Map<string, string[]>> {
  if (noteIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ recordId: noteTags.noteId, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(tags.id, noteTags.tagId))
    .where(inArray(noteTags.noteId, noteIds))
    .orderBy(asc(tags.name));
  return group(rows);
}

export async function tagsForDiaries(diaryIds: string[]): Promise<Map<string, string[]>> {
  if (diaryIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ recordId: diaryTags.diaryId, name: tags.name })
    .from(diaryTags)
    .innerJoin(tags, eq(tags.id, diaryTags.tagId))
    .where(inArray(diaryTags.diaryId, diaryIds))
    .orderBy(asc(tags.name));
  return group(rows);
}

/** 휴지통에 있지 않은 기록에 쓰인 태그 목록 */
export async function listActiveTags(): Promise<string[]> {
  const user = await requireUser();
  const db = getDb();
  const [noteRows, diaryRows] = await Promise.all([
    db
      .selectDistinct({ name: tags.name })
      .from(tags)
      .innerJoin(noteTags, eq(noteTags.tagId, tags.id))
      .innerJoin(notes, eq(notes.id, noteTags.noteId))
      .where(and(eq(tags.userId, user.id), isNull(notes.deletedAt))),
    db
      .selectDistinct({ name: tags.name })
      .from(tags)
      .innerJoin(diaryTags, eq(diaryTags.tagId, tags.id))
      .innerJoin(diaries, eq(diaries.id, diaryTags.diaryId))
      .where(and(eq(tags.userId, user.id), isNull(diaries.deletedAt))),
  ]);
  return Array.from(new Set([...noteRows, ...diaryRows].map((r) => r.name))).sort((a, b) => a.localeCompare(b, "ko"));
}

/** 특정 태그가 붙은 기록 id 를 고르는 하위 쿼리 */
export function noteIdsWithTag(userId: string, tagName: string) {
  return getDb()
    .select({ id: noteTags.noteId })
    .from(noteTags)
    .innerJoin(tags, eq(tags.id, noteTags.tagId))
    .where(and(eq(tags.userId, userId), eq(tags.name, tagName)));
}

export function diaryIdsWithTag(userId: string, tagName: string) {
  return getDb()
    .select({ id: diaryTags.diaryId })
    .from(diaryTags)
    .innerJoin(tags, eq(tags.id, diaryTags.tagId))
    .where(and(eq(tags.userId, userId), eq(tags.name, tagName)));
}
