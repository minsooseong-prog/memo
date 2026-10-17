"use server";

import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { diaries } from "@/db/schema";
import { deleteOrphanTags, syncDiaryTags } from "@/lib/data/tags";
import { logError, toUserMessage } from "@/lib/errors";
import { requireUser } from "@/lib/session";
import { diaryInputSchema, idSchema } from "@/lib/validation";
import type { ActionResult, SaveResult } from "@/types/records";

/** 일기 저장(자동 저장 포함) — 멱등 upsert, 본인 소유·휴지통 아님 조건 */
export async function saveDiary(id: unknown, input: unknown): Promise<SaveResult> {
  const user = await requireUser();
  const idParsed = idSchema.safeParse(id);
  const parsed = diaryInputSchema.safeParse(input);
  if (!idParsed.success) return { ok: false, error: "잘못된 일기입니다.", retry: false };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.", retry: false };
  const { tags, ...fields } = parsed.data;

  try {
    const row = await getDb().transaction(async (tx) => {
      const [saved] = await tx
        .insert(diaries)
        .values({ id: idParsed.data, userId: user.id, ...fields })
        .onConflictDoUpdate({
          target: diaries.id,
          set: { ...fields, updatedAt: sql`now()` },
          setWhere: and(eq(diaries.userId, user.id), isNull(diaries.deletedAt)),
        })
        .returning({ id: diaries.id, updatedAt: diaries.updatedAt });
      if (!saved) return null;
      await syncDiaryTags(tx, user.id, saved.id, tags);
      return saved;
    });
    if (!row) return { ok: false, error: "이 일기는 저장할 수 없습니다. 휴지통에 있는지 확인해 주세요.", retry: false };
    return { ok: true, updatedAt: row.updatedAt.toISOString() };
  } catch (error) {
    logError("saveDiary", error);
    return { ok: false, error: toUserMessage(error, "일기를 저장하지 못했습니다."), retry: true };
  }
}

export async function setDiaryFavorite(id: unknown, value: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success || typeof value !== "boolean") return { ok: false, error: "잘못된 요청입니다." };
  try {
    const rows = await getDb()
      .update(diaries)
      .set({ isFavorite: value })
      .where(and(eq(diaries.id, parsed.data), eq(diaries.userId, user.id), isNull(diaries.deletedAt)))
      .returning({ id: diaries.id });
    if (!rows.length) return { ok: false, error: "일기를 찾을 수 없습니다." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("setDiaryFavorite", error);
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function trashDiary(id: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };
  try {
    const rows = await getDb()
      .update(diaries)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(diaries.id, parsed.data), eq(diaries.userId, user.id), isNull(diaries.deletedAt)))
      .returning({ id: diaries.id });
    if (!rows.length) return { ok: false, error: "이미 휴지통에 있거나 없는 일기입니다." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("trashDiary", error);
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function restoreDiary(id: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };
  try {
    const rows = await getDb()
      .update(diaries)
      .set({ deletedAt: null })
      .where(and(eq(diaries.id, parsed.data), eq(diaries.userId, user.id), isNotNull(diaries.deletedAt)))
      .returning({ id: diaries.id });
    if (!rows.length) return { ok: false, error: "휴지통에서 일기를 찾을 수 없습니다." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("restoreDiary", error);
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function purgeDiary(id: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };
  try {
    const deleted = await getDb().transaction(async (tx) => {
      const rows = await tx
        .delete(diaries)
        .where(and(eq(diaries.id, parsed.data), eq(diaries.userId, user.id), isNotNull(diaries.deletedAt)))
        .returning({ id: diaries.id });
      if (rows.length) await deleteOrphanTags(tx, user.id);
      return rows.length;
    });
    if (!deleted) return { ok: false, error: "휴지통에 있는 일기만 영구 삭제할 수 있습니다." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("purgeDiary", error);
    return { ok: false, error: toUserMessage(error) };
  }
}
