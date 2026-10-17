import "server-only";
import { and, asc, count, desc, eq, gte, ilike, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { diaries } from "@/db/schema";
import type { DiarySummary } from "@/types/records";
import { PAGE_SIZE } from "../constants";
import { monthRange } from "../date";
import { requireUser } from "../session";
import { escapeLike } from "../text";
import { tagsForDiaries } from "./tags";

export const diaryColumns = {
  id: diaries.id,
  title: diaries.title,
  content: diaries.content,
  diaryDate: diaries.diaryDate,
  mood: diaries.mood,
  weather: diaries.weather,
  isFavorite: diaries.isFavorite,
  createdAt: diaries.createdAt,
  updatedAt: diaries.updatedAt,
};

export async function withDiaryTags<T extends { id: string }>(rows: T[]): Promise<(T & { tags: string[] })[]> {
  const map = await tagsForDiaries(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, tags: map.get(r.id) ?? [] }));
}

export async function listDiaries(options: { q?: string; month?: string; page: number }) {
  const user = await requireUser();
  const conditions: SQL[] = [eq(diaries.userId, user.id), isNull(diaries.deletedAt)];
  if (options.q) {
    const pattern = `%${escapeLike(options.q)}%`;
    const match = or(ilike(diaries.title, pattern), ilike(diaries.content, pattern));
    if (match) conditions.push(match);
  }
  if (options.month) {
    const { start, end } = monthRange(options.month);
    conditions.push(gte(diaries.diaryDate, start), lte(diaries.diaryDate, end));
  }
  const where = and(...conditions);
  const db = getDb();
  const [rows, totalRows] = await Promise.all([
    db
      .select(diaryColumns)
      .from(diaries)
      .where(where)
      .orderBy(desc(diaries.diaryDate), desc(diaries.createdAt))
      .limit(PAGE_SIZE)
      .offset((options.page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(diaries).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;
  const items: DiarySummary[] = await withDiaryTags(rows);
  return { items, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** 연도별 월간 일기 개수: { "2026-01": 3, ... } */
export async function diaryCountsByMonth(year: number): Promise<Record<string, number>> {
  const user = await requireUser();
  const ym = sql<string>`to_char(${diaries.diaryDate}, 'YYYY-MM')`;
  const rows = await getDb()
    .select({ month: ym, value: count() })
    .from(diaries)
    .where(
      and(
        eq(diaries.userId, user.id),
        isNull(diaries.deletedAt),
        gte(diaries.diaryDate, `${year}-01-01`),
        lte(diaries.diaryDate, `${year}-12-31`),
      ),
    )
    .groupBy(ym);
  return Object.fromEntries(rows.map((r) => [r.month, r.value]));
}

export async function getMonthDiaries(ym: string) {
  const user = await requireUser();
  const { start, end } = monthRange(ym);
  return getDb()
    .select({ id: diaries.id, title: diaries.title, diaryDate: diaries.diaryDate, mood: diaries.mood, weather: diaries.weather })
    .from(diaries)
    .where(and(eq(diaries.userId, user.id), isNull(diaries.deletedAt), gte(diaries.diaryDate, start), lte(diaries.diaryDate, end)))
    .orderBy(asc(diaries.diaryDate), asc(diaries.createdAt));
}

export async function getDiary(id: string) {
  const user = await requireUser();
  const rows = await getDb()
    .select({ ...diaryColumns, deletedAt: diaries.deletedAt })
    .from(diaries)
    .where(and(eq(diaries.id, id), eq(diaries.userId, user.id)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const [withTags] = await withDiaryTags([row]);
  return withTags;
}
