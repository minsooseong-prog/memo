"use client";

import { ChevronLeft, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { saveDiary, trashDiary } from "@/actions/diaries";
import { DateLeaf } from "@/components/shared/date-leaf";
import { DraftBanner, TrashBanner } from "@/components/shared/banners";
import { ExportMenu } from "@/components/shared/export-menu";
import { MarkdownField } from "@/components/shared/markdown-field";
import { SaveStatus } from "@/components/shared/save-status";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LIMITS, MOOD_VALUES, WEATHER_VALUES, type Mood, type Weather } from "@/lib/constants";
import { formatDateTime, formatKoreanDate, isValidDateString } from "@/lib/date";
import { removeDraft, useAutosave, type SaveOutcome } from "@/lib/hooks/use-autosave";
import { cn } from "@/lib/utils";
import { MoodPicker, WeatherPicker } from "./pickers";
import { diaryHref } from "@/lib/routes";

export type DiaryValue = {
  title: string;
  content: string;
  diaryDate: string;
  mood: Mood | null;
  weather: Weather | null;
  isFavorite: boolean;
  tags: string[];
};

function parseDiaryDraft(raw: unknown): DiaryValue | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string" || typeof r.content !== "string" || typeof r.diaryDate !== "string" || !isValidDateString(r.diaryDate)) {
    return null;
  }
  return {
    title: r.title.slice(0, LIMITS.title),
    content: r.content.slice(0, LIMITS.content),
    diaryDate: r.diaryDate,
    mood: (MOOD_VALUES as readonly unknown[]).includes(r.mood) ? (r.mood as Mood) : null,
    weather: (WEATHER_VALUES as readonly unknown[]).includes(r.weather) ? (r.weather as Weather) : null,
    isFavorite: r.isFavorite === true,
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string").slice(0, LIMITS.tagsPerRecord) : [],
  };
}

function validateDiary(v: DiaryValue): true | false | string {
  const hasText = Boolean(v.title.trim() || v.content.trim());
  if (!v.mood) return hasText ? "오늘의 기분을 고르면 저장됩니다" : false;
  return true;
}

type Props = {
  id: string;
  initial: DiaryValue;
  isNew: boolean;
  deleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export function DiaryEditor({ id, initial, isNew, deleted, createdAt, updatedAt }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<DiaryValue>(initial);
  const [persisted, setPersisted] = useState(!isNew);
  const persistedRef = useRef(!isNew);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const draftKey = persisted ? `diary-draft:${id}` : "diary-draft:new";

  const save = useCallback(
    async (v: DiaryValue): Promise<SaveOutcome> => {
      if (!v.mood) return { ok: false, error: "오늘의 기분을 선택해 주세요.", retry: false };
      const result = await saveDiary(id, { ...v, mood: v.mood });
      if (!result.ok) return result;
      if (!persistedRef.current) {
        persistedRef.current = true;
        setPersisted(true);
        window.history.replaceState(null, "", diaryHref(id));
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
    validate: validateDiary,
    parseDraft: parseDiaryDraft,
    enabled: !deleted,
  });

  function update<K extends keyof DiaryValue>(key: K, next: DiaryValue[K]) {
    setValue((prev) => ({ ...prev, [key]: next }));
    autosave.markChanged();
  }

  const calendarHref = `/diary/calendar?month=${value.diaryDate.slice(0, 7)}&date=${value.diaryDate}`;

  async function handleDone() {
    const ok = await autosave.flush();
    if (ok || !autosave.hasUnsaved()) router.push(calendarHref);
  }

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      if (!persistedRef.current) {
        removeDraft(draftKey);
        router.push("/diary");
        return;
      }
      await autosave.flush();
      const result = await trashDiary(id);
      if (result.ok) {
        removeDraft(`diary-draft:${id}`);
        setConfirmOpen(false);
        router.push("/diary");
      } else setActionError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-1">
        <Link href="/diary" className="mr-auto flex items-center gap-1 rounded-lg py-1 pr-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> 일기
        </Link>
        {!deleted && (
          <>
            <div className="mr-2 hidden sm:block">
              <SaveStatus status={autosave.status} message={autosave.message} onRetry={() => void autosave.flush()} />
            </div>
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
            {persisted && <ExportMenu kind="diary" id={id} />}
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

      {deleted && <TrashBanner kind="diary" id={id} />}
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
        <div className="flex items-center gap-4">
          <DateLeaf date={value.diaryDate} size="lg" />
          <div>
            <p className="font-serif text-lg font-semibold">{formatKoreanDate(value.diaryDate)}</p>
            <label className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              날짜 바꾸기
              <input
                type="date"
                value={value.diaryDate}
                disabled={deleted}
                onChange={(e) => e.target.value && isValidDateString(e.target.value) && update("diaryDate", e.target.value)}
                className="h-8 rounded-md border border-input bg-card px-2 text-sm text-foreground"
              />
            </label>
          </div>
        </div>

        <section className="mt-6 space-y-4 rounded-xl border bg-card p-4">
          <div>
            <p className="mb-2 text-sm font-medium">오늘의 기분</p>
            <MoodPicker value={value.mood} onChange={(m) => update("mood", m)} disabled={deleted} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">날씨</p>
            <WeatherPicker value={value.weather} onChange={(w) => update("weather", w)} disabled={deleted} />
          </div>
        </section>

        <input
          value={value.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="오늘의 제목 (선택)"
          aria-label="제목"
          maxLength={LIMITS.title}
          disabled={deleted}
          className="mt-7 w-full bg-transparent font-serif text-2xl font-semibold outline-none placeholder:text-muted-foreground/40 disabled:opacity-80"
        />
        <div className="mt-3">
          <TagInput value={value.tags} onChange={(tags) => update("tags", tags)} disabled={deleted} />
        </div>
        <div className="mt-4 border-t pt-2">
          <MarkdownField
            value={value.content}
            onChange={(content) => update("content", content)}
            placeholder="오늘 하루는 어땠나요?"
            serif
            disabled={deleted}
          />
        </div>
        {createdAt && updatedAt && (
          <p className="mt-10 text-xs text-muted-foreground">
            처음 쓴 시각 {formatDateTime(createdAt)}
            <br />
            마지막 수정 {formatDateTime(updatedAt)}
          </p>
        )}
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title={persisted ? "일기를 휴지통으로 옮길까요?" : "작성 중인 일기를 버릴까요?"}
        description={persisted ? "휴지통에서 언제든 복원할 수 있습니다." : "아직 저장되지 않은 일기입니다. 버리면 되돌릴 수 없습니다."}
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
