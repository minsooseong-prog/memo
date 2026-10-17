"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { diaries, notes } from "@/db/schema";
import { deleteOrphanTags } from "@/lib/data/tags";
import { logError, toUserMessage } from "@/lib/errors";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "@/types/records";

/** 휴지통 비우기: 본인의 휴지통 항목만 영구 삭제 */
export async function emptyTrash(): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await getDb().transaction(async (tx) => {
      await tx.delete(notes).where(and(eq(notes.userId, user.id), isNotNull(notes.deletedAt)));
      await tx.delete(diaries).where(and(eq(diaries.userId, user.id), isNotNull(diaries.deletedAt)));
      await deleteOrphanTags(tx, user.id);
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    logError("emptyTrash", error);
    return { ok: false, error: toUserMessage(error) };
  }
}
