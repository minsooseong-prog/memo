"use client";

import { History, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { purgeDiary, restoreDiary } from "@/actions/diaries";
import { purgeNote, restoreNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/lib/date";

export function DraftBanner({ savedAt, onRestore, onDiscard }: { savedAt: number | null; onRestore: () => void; onDiscard: () => void }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm sm:flex-row sm:items-center">
      <History className="hidden size-4 shrink-0 text-highlight sm:block" />
      <p className="flex-1">
        저장되지 않은 내용이 이 기기에 남아 있습니다
        {savedAt && <span className="text-muted-foreground"> ({formatDateTime(new Date(savedAt))})</span>}.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onRestore}>
          이어서 쓰기
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          버리기
        </Button>
      </div>
    </div>
  );
}

/** 휴지통에 있는 기록을 열었을 때: 읽기 전용 안내 + 복원/영구 삭제 */
export function TrashBanner({ kind, id }: { kind: "note" | "diary"; id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = () =>
    startTransition(async () => {
      const result = kind === "note" ? await restoreNote(id) : await restoreDiary(id);
      if (result.ok) router.refresh();
      else setError(result.error);
    });

  const purge = () =>
    startTransition(async () => {
      const result = kind === "note" ? await purgeNote(id) : await purgeDiary(id);
      if (result.ok) {
        setConfirmOpen(false);
        router.push("/trash");
      } else setError(result.error);
    });

  return (
    <div className="mb-5 rounded-xl border bg-muted px-4 py-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1">휴지통에 있는 {kind === "note" ? "메모" : "일기"}입니다. 복원해야 수정할 수 있습니다.</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={restore} disabled={pending}>
            <RotateCcw /> 복원
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmOpen(true)} disabled={pending}>
            <Trash2 /> 영구 삭제
          </Button>
        </div>
      </div>
      {error && !confirmOpen && <p className="mt-2 text-destructive">{error}</p>}
      <ConfirmDialog
        open={confirmOpen}
        title="영구 삭제할까요?"
        description="영구 삭제한 기록은 되돌릴 수 없습니다."
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
