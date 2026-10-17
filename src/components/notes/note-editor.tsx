"use client";

import { ChevronLeft, Pin, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { saveNote, trashNote } from "@/actions/notes";
import { DraftBanner, TrashBanner } from "@/components/shared/banners";
import { ExportMenu } from "@/components/shared/export-menu";
import { MarkdownField } from "@/components/shared/markdown-field";
import { SaveStatus } from "@/components/shared/save-status";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LIMITS } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { removeDraft, useAutosave, type SaveOutcome } from "@/lib/hooks/use-autosave";
import { cn } from "@/lib/utils";
import { noteHref } from "@/lib/routes";

export type NoteValue = { title: string; content: string; isPinned: boolean; isFavorite: boolean; tags: string[] };

function parseNoteDraft(raw: unknown): NoteValue | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string" || typeof r.content !== "string") return null;
  return {
    title: r.title.slice(0, LIMITS.title),
    content: r.content.slice(0, LIMITS.content),
    isPinned: r.isPinned === true,
    isFavorite: r.isFavorite === true,
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string").slice(0, LIMITS.tagsPerRecord) : [],
  };
}

const validateNote = (v: NoteValue) => Boolean(v.title.trim() || v.content.trim());

type Props = {
  id: string;
  initial: NoteValue;
  isNew: boolean;
  deleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export function NoteEditor({ id, initial, isNew, deleted, createdAt, updatedAt }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<NoteValue>(initial);
  const [persisted, setPersisted] = useState(!isNew);
  const persistedRef = useRef(!isNew);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const draftKey = persisted ? `note-draft:${id}` : "note-draft:new";

  const save = useCallback(
    async (v: NoteValue): Promise<SaveOutcome> => {
      const result = await saveNote(id, v);
      if (!result.ok) return result;
      if (!persistedRef.current) {
        persistedRef.current = true;
        setPersisted(true);
        // 화면을 다시 그리지 않고 주소만 바꿔 계속 작성할 수 있게 합니다.
        window.history.replaceState(null, "", noteHref(id));
      }
      return { ok: true };
    },
    [id],
  );

  const autosave = useAutosave({
    value,
    initialValue: initial,
    draftKey,
    save,
    validate: validateNote,
    parseDraft: parseNoteDraft,
    enabled: !deleted,
  });

  function update<K extends keyof NoteValue>(key: K, next: NoteValue[K]) {
    setValue((prev) => ({ ...prev, [key]: next }));
    autosave.markChanged();
  }

  async function handleDone() {
    const ok = await autosave.flush();
    if (ok || !autosave.hasUnsaved()) router.push("/notes");
  }

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      if (!persistedRef.current) {
        removeDraft(draftKey);
        router.push("/notes");
        return;
      }
      await autosave.flush();
      const result = await trashNote(id);
      if (result.ok) {
        removeDraft(`note-draft:${id}`);
        setConfirmOpen(false);
        router.push("/notes");
      } else setActionError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-1">
        <Link href="/notes" className="mr-auto flex items-center gap-1 rounded-lg py-1 pr-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> 메모
        </Link>
        {!deleted && (
          <>
            <div className="mr-2 hidden sm:block">
              <SaveStatus status={autosave.status} message={autosave.message} onRetry={() => void autosave.flush()} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={value.isPinned}
              aria-label={value.isPinned ? "고정 해제" : "맨 위에 고정"}
              title={value.isPinned ? "고정 해제" : "맨 위에 고정"}
              onClick={() => update("isPinned", !value.isPinned)}
            >
              <Pin className={cn(value.isPinned && "fill-highlight text-highlight")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-pressed={value.isFavorite}
              aria-label={value.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
              title={value.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
              onClick={() => update("isFavorite", !value.isFavorite)}
            >
              <Star className={cn(value.isFavorite && "fill-highlight text-highlight")} />
            </Button>
            {persisted && <ExportMenu kind="note" id={id} />}
            <Button variant="ghost" size="icon" aria-label="삭제" title="삭제" onClick={() => setConfirmOpen(true)}>
              <Trash2 />
            </Button>
            <Button size="sm" className="ml-1" onClick={() => void handleDone()}>
              완료
            </Button>
          </>
        )}
      </div>

      <div className="mb-3 sm:hidden">
        <SaveStatus status={autosave.status} message={autosave.message} onRetry={() => void autosave.flush()} />
      </div>

      {deleted && <TrashBanner kind="note" id={id} />}
      {!deleted && autosave.pendingDraft && (
        <DraftBanner
          savedAt={autosave.pendingDraft.savedAt}
          onRestore={() => {
            const draft = autosave.pendingDraft;
            if (!draft) return;
            setValue(draft.value);
            autosave.markChanged();
            autosave.dismissDraft(false);
          }}
          onDiscard={() => autosave.dismissDraft(true)}
        />
      )}

      <article className="animate-rise">
        <input
          value={value.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="제목"
          aria-label="제목"
          maxLength={LIMITS.title}
          autoFocus={isNew}
          disabled={deleted}
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 disabled:opacity-80 md:text-3xl"
        />
        <div className="mt-3">
          <TagInput value={value.tags} onChange={(tags) => update("tags", tags)} disabled={deleted} />
        </div>
        <div className="mt-4 border-t pt-2">
          <MarkdownField
            value={value.content}
            onChange={(content) => update("content", content)}
            placeholder="생각나는 것을 자유롭게 적어 보세요. 마크다운 문법을 쓸 수 있습니다."
            disabled={deleted}
          />
        </div>
        {createdAt && updatedAt && (
          <p className="mt-10 text-xs text-muted-foreground">
            작성 {formatDateTime(createdAt)} · 수정 {formatDateTime(updatedAt)}
          </p>
        )}
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title={persisted ? "메모를 휴지통으로 옮길까요?" : "작성 중인 메모를 버릴까요?"}
        description={persisted ? "휴지통에서 언제든 복원할 수 있습니다." : "아직 저장되지 않은 메모입니다. 버리면 되돌릴 수 없습니다."}
        confirmLabel={persisted ? "휴지통으로 이동" : "버리기"}
        destructive
        pending={pending}
        error={actionError}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
