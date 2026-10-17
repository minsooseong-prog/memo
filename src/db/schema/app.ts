import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { LIMITS, MOOD_VALUES, WEATHER_VALUES } from "../../lib/constants";
import { user } from "./auth";

// precision 3(밀리초): JS Date 와 정확히 왕복됩니다.
const tz = (name: string) => timestamp(name, { withTimezone: true, precision: 3 });
const quoted = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(", "));
const ownerId = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

/** 메모. deleted_at 이 있으면 휴지통 상태 */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    title: text("title").notNull().default(""),
    content: text("content").notNull().default(""),
    isPinned: boolean("is_pinned").notNull().default(false),
    isFavorite: boolean("is_favorite").notNull().default(false),
    deletedAt: tz("deleted_at"),
    createdAt: tz("created_at").notNull().defaultNow(),
    updatedAt: tz("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("notes_user_active_updated_idx").on(t.userId, t.deletedAt, t.updatedAt.desc()),
    index("notes_user_created_idx").on(t.userId, t.createdAt),
    check("notes_title_length_check", sql`char_length("title") <= ${sql.raw(String(LIMITS.title))}`),
    check("notes_content_length_check", sql`char_length("content") <= ${sql.raw(String(LIMITS.content))}`),
  ],
);

/** 일기. diary_date(쓴 날짜)와 created_at(작성 시각)을 따로 관리합니다. */
export const diaries = pgTable(
  "diaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    title: text("title").notNull().default(""),
    content: text("content").notNull().default(""),
    diaryDate: date("diary_date", { mode: "string" }).notNull(),
    mood: varchar("mood", { length: 20, enum: MOOD_VALUES }).notNull(),
    weather: varchar("weather", { length: 20, enum: WEATHER_VALUES }),
    isFavorite: boolean("is_favorite").notNull().default(false),
    deletedAt: tz("deleted_at"),
    createdAt: tz("created_at").notNull().defaultNow(),
    updatedAt: tz("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("diaries_user_date_idx").on(t.userId, t.diaryDate.desc(), t.createdAt.desc()),
    index("diaries_user_deleted_idx").on(t.userId, t.deletedAt),
    check("diaries_mood_check", sql`"mood" IN (${quoted(MOOD_VALUES)})`),
    check("diaries_weather_check", sql`"weather" IS NULL OR "weather" IN (${quoted(WEATHER_VALUES)})`),
    check("diaries_title_length_check", sql`char_length("title") <= ${sql.raw(String(LIMITS.title))}`),
    check("diaries_content_length_check", sql`char_length("content") <= ${sql.raw(String(LIMITS.content))}`),
  ],
);

/** 사용자별 태그 사전 */
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: ownerId(),
    name: varchar("name", { length: LIMITS.tagName }).notNull(),
    createdAt: tz("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("tags_user_name_uq").on(t.userId, t.name)],
);

export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.tagId] }), index("note_tags_tag_idx").on(t.tagId)],
);

export const diaryTags = pgTable(
  "diary_tags",
  {
    diaryId: uuid("diary_id")
      .notNull()
      .references(() => diaries.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.diaryId, t.tagId] }), index("diary_tags_tag_idx").on(t.tagId)],
);

/** PIN 연속 실패 기록(사용자당 1행). 서버리스 환경이라 메모리가 아닌 DB 에 둡니다. */
export const pinAttempts = pgTable("pin_attempts", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  failures: integer("failures").notNull().default(0),
  lockedUntil: tz("locked_until"),
  updatedAt: tz("updated_at").notNull().defaultNow(),
});
