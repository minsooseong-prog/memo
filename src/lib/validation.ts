import { z } from "zod";
import { LIMITS, MOOD_VALUES, WEATHER_VALUES } from "./constants";
import { isValidDateString } from "./date";
import { normalizeTag } from "./text";

export const idSchema = z.uuid();

export const dateStringSchema = z.string().refine(isValidDateString, "올바른 날짜가 아닙니다.");

export const tagListSchema = z
  .array(
    z
      .string()
      .transform(normalizeTag)
      .pipe(z.string().min(1, "빈 태그는 쓸 수 없습니다.").max(LIMITS.tagName, `태그는 ${LIMITS.tagName}자 이하입니다.`)),
  )
  .max(LIMITS.tagsPerRecord, `태그는 최대 ${LIMITS.tagsPerRecord}개입니다.`)
  .transform((tags) => Array.from(new Set(tags)));

const titleSchema = z.string().trim().max(LIMITS.title, `제목은 ${LIMITS.title}자 이하입니다.`);
const contentSchema = z.string().max(LIMITS.content, "본문이 너무 깁니다.");

export const noteInputSchema = z
  .object({
    title: titleSchema,
    content: contentSchema,
    isPinned: z.boolean(),
    isFavorite: z.boolean(),
    tags: tagListSchema,
  })
  .refine((v) => v.title.length > 0 || v.content.trim().length > 0, "제목이나 본문을 입력해 주세요.");
export type NoteInput = z.infer<typeof noteInputSchema>;

export const diaryInputSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  diaryDate: dateStringSchema,
  mood: z.enum(MOOD_VALUES, { error: "오늘의 기분을 선택해 주세요." }),
  weather: z.enum(WEATHER_VALUES).nullable(),
  isFavorite: z.boolean(),
  tags: tagListSchema,
});
export type DiaryInput = z.infer<typeof diaryInputSchema>;

export const noteFlagSchema = z.enum(["isPinned", "isFavorite"]);
export const recordKindSchema = z.enum(["note", "diary"]);
export type RecordKind = z.infer<typeof recordKindSchema>;

const optionalQuery = z
  .string()
  .trim()
  .max(LIMITS.query)
  .optional()
  .transform((v) => v || undefined);

export const searchQuerySchema = z.object({
  q: optionalQuery,
  type: z.enum(["all", "note", "diary"]).catch("all"),
  tag: optionalQuery,
  from: dateStringSchema.optional().catch(undefined),
  to: dateStringSchema.optional().catch(undefined),
  sort: z.enum(["newest", "oldest", "title"]).catch("newest"),
});

export const noteSortSchema = z.enum(["latest", "oldest", "title"]).catch("latest");

export const passwordSchema = z
  .string()
  .min(LIMITS.passwordMin, `비밀번호는 ${LIMITS.passwordMin}자 이상이어야 합니다.`)
  .max(LIMITS.passwordMax, `비밀번호는 ${LIMITS.passwordMax}자 이하여야 합니다.`);

export const ownerSchema = z.object({
  email: z.email("올바른 이메일 주소가 아닙니다.").transform((v) => v.trim().toLowerCase()),
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(50),
  password: passwordSchema,
});
