"use server";

import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { deleteOrphanTags, syncNoteTags } from "@/lib/data/tags";
import { logError, toUserMessage } from "@/lib/errors";
import { requireUser } from "@/lib/session";
import { idSchema, noteFlagSchema, noteInputSchema } from "@/lib/validation";
import type { ActionResult, SaveResult } from "@/types/records";

/**
 * 메모 저장(자동 저장 포함). id 는 화면을 열 때 서버가 미리 발급한 UUID 이므로
 * 같은 요청이 여러 번 와도 메모가 중복 생성되지 않습니다(멱등 upsert).
 * 다른 사용자의 id 이거나 휴지통에 있는 메모라면 저장되지 않습니다.
 */
export async function saveNote(id: unknown, input: unknown): Promise<SaveResult> {
  const user = await requireUser();
  const idParsed = idSchema.safeParse(id);
  const parsed = noteInputSchema.safeParse(input);
  if (!idParsed.success) return { ok: false, error: "잘못된 메모입니다.", retry: false };
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.", retry: false };
  const { tags, ...fields } = parsed.data;

  try {
    const row = await getDb().transaction(async (tx) => {
      const [saved] = await tx
        .insert(notes)
        .values({ id: idParsed.data, userId: user.id, ...fields })
        .onConflictDoUpdate({
          target: notes.id,
          set: { ...fields, updatedAt: sql`now()` },
          setWhere: and(eq(notes.userId, user.id), isNull(notes.deletedAt)),
        })
        .returning({ id: notes.id, updatedAt: notes.updatedAt });
      if (!saved) return null;
      await syncNoteTags(tx, user.id, saved.id, tags);
      return saved;
    });
    if (!row) return { ok: false, error: "이 메모는 저장할 수 없습니다. 휴지통에 있는지 확인해 주세요.", retry: false };
    return { ok: true, updatedAt: row.updatedAt.toISOString() };
  } catch (error) {
    logError("saveNote", error);
    return { ok: false, error: toUserMessage(error, "메모를 저장하지 못했습니다."), retry: true };
  }
}

export async function setNoteFlag(id: unknown, flag: unknown, value: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const idParsed = idSchema.safeParse(id);
  const flagParsed = noteFlagSchema.safeParse(flag);
  if (!idParsed.success || !flagParsed.success || typeof value !== "boolean") return { ok: false, error: "잘못된 요청입니다." };
  try {
    const rows = await getDb()
      .update(notes)
      .set(flagParsed.data === "isPinned" ? { isPinned: value } : { isFavorite: value })
      .where(and(eq(notes.id, idParsed.data), eq(notes.userId, user.id), isNull(notes.deletedAt)))
      .returning({ id: notes.id });
    if (!rows.length) return { ok: false, error: "메모를 찾을 수 없습니다." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("setNoteFlag", error);
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function trashNote(id: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };
  try {
    const rows = await getDb()
      .update(notes)
      .set({ deletedAt: sql`now()`, isPinned: false })
      .where(and(eq(notes.id, parsed.data), eq(notes.userId, user.id), isNull(notes.deletedAt)))
      .returning({ id: notes.id });
    if (!rows.length) return { ok: false, error: "이미 휴지통에 있거나 없는 메모입니다." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("trashNote", error);
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function restoreNote(id: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };
  try {
    const rows = await getDb()
      .update(notes)
      .set({ deletedAt: null })
      .where(and(eq(notes.id, parsed.data), eq(notes.userId, user.id), isNotNull(notes.deletedAt)))
      .returning({ id: notes.id });
    if (!rows.length) return { ok: false, error: "휴지통에서 메모를 찾을 수 없습니다." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("restoreNote", error);
    return { ok: false, error: toUserMessage(error) };
  }
}

/** 영구 삭제: 휴지통에 있는 메모만 가능 */
export async function purgeNote(id: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };
  try {
    const deleted = await getDb().transaction(async (tx) => {
      const rows = await tx
        .delete(notes)
        .where(and(eq(notes.id, parsed.data), eq(notes.userId, user.id), isNotNull(notes.deletedAt)))
        .returning({ id: notes.id });
      if (rows.length) await deleteOrphanTags(tx, user.id);
      return rows.length;
    });
    if (!deleted) return { ok: false, error: "휴지통에 있는 메모만 영구 삭제할 수 있습니다." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("purgeNote", error);
    return { ok: false, error: toUserMessage(error) };
  }
}
