"use client";

import { Pin, Star, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { setNoteFlag, trashNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

/** 목록에서 바로 쓰는 고정·즐겨찾기·삭제 버튼 */
export function NoteQuickActions({ id, isPinned, isFavorite, className }: { id: string; isPinned: boolean; isFavorite: boolean; className?: string }) {
  const [flags, setFlags] = useOptimistic({ isPinned, isFavorite });
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (flag: "isPinned" | "isFavorite") =>
    startTransition(async () => {
      const next = !flags[flag];
      setFlags({ ...flags, [flag]: next });
      const result = await setNoteFlag(id, flag, next);
      if (!result.ok) setError(result.error);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await trashNote(id);
      if (result.ok) setConfirmOpen(false);
      else setError(result.error);
    });

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={flags.isPinned ? "고정 해제" : "맨 위에 고정"}
        title={flags.isPinned ? "고정 해제" : "맨 위에 고정"}
        aria-pressed={flags.isPinned}
        disabled={pending}
        onClick={() => toggle("isPinned")}
      >
        <Pin className={cn(flags.isPinned && "fill-highlight text-highlight")} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={flags.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
        title={flags.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
        aria-pressed={flags.isFavorite}
        disabled={pending}
        onClick={() => toggle("isFavorite")}
      >
        <Star className={cn(flags.isFavorite && "fill-highlight text-highlight")} />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="휴지통으로 이동" title="휴지통으로 이동" disabled={pending} onClick={() => setConfirmOpen(true)}>
        <Trash2 />
      </Button>
      {error && !confirmOpen && (
        <span role="alert" className="ml-1 text-xs text-destructive">
          {error}
        </span>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="메모를 휴지통으로 옮길까요?"
        description="휴지통에서 언제든 복원할 수 있습니다."
        confirmLabel="휴지통으로 이동"
        destructive
        pending={pending}
        error={error}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
