import "server-only";
import { and, desc, eq, gte, ilike, inArray, isNull, lte, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { diaries, notes } from "@/db/schema";
import type { Mood } from "../constants";
import { kstDayEnd, kstDayStart, toKstDate } from "../date";
import { requireUser } from "../session";
import { escapeLike } from "../text";
import { withDiaryTags } from "./diaries";
import { withNoteTags } from "./notes";
import { diaryIdsWithTag, noteIdsWithTag } from "./tags";

export type SearchFilters = {
  q?: string;
  type: "all" | "note" | "diary";
  tag?: string;
  from?: string;
  to?: string;
  sort: "newest" | "oldest" | "title";
};

export type SearchHit = {
  kind: "note" | "diary";
  id: string;
  title: string;
  content: string;
  /** 메모: 수정일(KST), 일기: 일기 날짜 */
  date: string;
  sortTime: number;
  tags: string[];
  mood?: Mood;
};

const LIMIT_PER_KIND = 100;

export async function searchRecords(filters: SearchFilters): Promise<SearchHit[]> {
  const user = await requireUser();
  const db = getDb();
  const pattern = filters.q ? `%${escapeLike(filters.q)}%` : null;
  const tasks: Promise<SearchHit[]>[] = [];

  if (filters.type !== "diary") {
    const c: SQL[] = [eq(notes.userId, user.id), isNull(notes.deletedAt)];
    if (pattern) {
      const m = or(ilike(notes.title, pattern), ilike(notes.content, pattern));
      if (m) c.push(m);
    }
    if (filters.tag) c.push(inArray(notes.id, noteIdsWithTag(user.id, filters.tag)));
    if (filters.from) c.push(gte(notes.updatedAt, kstDayStart(filters.from)));
    if (filters.to) c.push(lte(notes.updatedAt, kstDayEnd(filters.to)));
    tasks.push(
      db
        .select({ id: notes.id, title: notes.title, content: notes.content, updatedAt: notes.updatedAt })
        .from(notes)
        .where(and(...c))
        .orderBy(desc(notes.updatedAt))
        .limit(LIMIT_PER_KIND)
        .then(withNoteTags)
        .then((rows) =>
          rows.map((r) => ({
            kind: "note" as const,
            id: r.id,
            title: r.title,
            content: r.content,
            date: toKstDate(r.updatedAt),
            sortTime: r.updatedAt.getTime(),
            tags: r.tags,
          })),
        ),
    );
  }

  if (filters.type !== "note") {
    const c: SQL[] = [eq(diaries.userId, user.id), isNull(diaries.deletedAt)];
    if (pattern) {
      const m = or(ilike(diaries.title, pattern), ilike(diaries.content, pattern));
      if (m) c.push(m);
    }
    if (filters.tag) c.push(inArray(diaries.id, diaryIdsWithTag(user.id, filters.tag)));
    if (filters.from) c.push(gte(diaries.diaryDate, filters.from));
    if (filters.to) c.push(lte(diaries.diaryDate, filters.to));
    tasks.push(
      db
        .select({
          id: diaries.id,
          title: diaries.title,
          content: diaries.content,
          diaryDate: diaries.diaryDate,
          mood: diaries.mood,
          createdAt: diaries.createdAt,
        })
        .from(diaries)
        .where(and(...c))
        .orderBy(desc(diaries.diaryDate), desc(diaries.createdAt))
        .limit(LIMIT_PER_KIND)
        .then(withDiaryTags)
        .then((rows) =>
          rows.map((r) => ({
            kind: "diary" as const,
            id: r.id,
            title: r.title,
            content: r.content,
            date: r.diaryDate,
            sortTime: Date.parse(`${r.diaryDate}T00:00:00+09:00`) + (r.createdAt.getTime() % 86_400_000),
            tags: r.tags,
            mood: r.mood,
          })),
        ),
    );
  }

  const hits = (await Promise.all(tasks)).flat();
  if (filters.sort === "title") hits.sort((a, b) => a.title.localeCompare(b.title, "ko") || b.sortTime - a.sortTime);
  else if (filters.sort === "oldest") hits.sort((a, b) => a.sortTime - b.sortTime);
  else hits.sort((a, b) => b.sortTime - a.sortTime);
  return hits;
}
