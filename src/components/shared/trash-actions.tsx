"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { purgeDiary, restoreDiary } from "@/actions/diaries";
import { purgeNote, restoreNote } from "@/actions/notes";
import { emptyTrash } from "@/actions/trash";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function TrashItemActions({ kind, id, title }: { kind: "note" | "diary"; id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = () =>
    startTransition(async () => {
      const r = kind === "note" ? await restoreNote(id) : await restoreDiary(id);
      if (!r.ok) setError(r.error);
    });
  const purge = () =>
    startTransition(async () => {
      const r = kind === "note" ? await purgeNote(id) : await purgeDiary(id);
      if (r.ok) setConfirmOpen(false);
      else setError(r.error);
    });

  return (
    <div className="flex shrink-0 items-center gap-1">
      {error && !confirmOpen && <span className="text-xs text-destructive">{error}</span>}
      <Button size="sm" variant="ghost" onClick={restore} disabled={pending}>
        <RotateCcw /> 복원
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmOpen(true)} disabled={pending}>
        <Trash2 /> 영구 삭제
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title="영구 삭제할까요?"
        description={`「${title}」을(를) 영구 삭제하면 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
        destructive
        pending={pending}
        error={error}
        onConfirm={purge}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export function EmptyTrashButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)} disabled={count === 0}>
        <Trash2 /> 휴지통 비우기
      </Button>
      <ConfirmDialog
        open={open}
        title="휴지통을 비울까요?"
        description={`휴지통의 기록 ${count}개가 모두 영구 삭제됩니다. 되돌릴 수 없습니다.`}
        confirmLabel="모두 영구 삭제"
        destructive
        pending={pending}
        error={error}
        onConfirm={() =>
          startTransition(async () => {
            const r = await emptyTrash();
            if (r.ok) setOpen(false);
            else setError(r.error);
          })
        }
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
