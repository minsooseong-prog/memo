"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error" | "blocked";
export type SaveOutcome = { ok: true } | { ok: false; error: string; retry: boolean };

type Options<T> = {
  value: T;
  initialValue: T;
  draftKey: string;
  save: (value: T) => Promise<SaveOutcome>;
  /** true: 저장, false: 조용히 건너뜀(빈 글), 문자열: 저장하지 않고 이유 표시 */
  validate: (value: T) => true | false | string;
  /** localStorage 의 초안을 안전하게 복원(형식이 맞지 않으면 null) */
  parseDraft: (raw: unknown) => T | null;
  delay?: number;
  enabled?: boolean;
};

const RETRY_DELAY = 15_000;

// ── localStorage 초안: 서버 저장이 실패해도 작성 중인 글을 잃지 않기 위한 보조 저장소 ──
export function writeDraft(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: 1, savedAt: Date.now(), value }));
  } catch {
    /* 저장 공간 부족·비공개 모드 등: 서버 저장은 계속 시도 */
  }
}

export function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* 무시 */
  }
}

// 처음 열 때의 초안만 읽도록 키별로 한 번 읽어 캐시합니다(입력 중 배너가 다시 뜨지 않게).
const draftCache = new Map<string, string | null>();
function readDraftOnce(key: string): string | null {
  if (!draftCache.has(key)) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      raw = null;
    }
    draftCache.set(key, raw);
  }
  return draftCache.get(key) ?? null;
}
const noopSubscribe = () => () => {};

export function useAutosave<T>({ value, initialValue, draftKey, save, validate, parseDraft, delay = 1200, enabled = true }: Options<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [draftDismissed, setDraftDismissed] = useState(false);

  const valueRef = useRef(value);
  const saveRef = useRef(save);
  const validateRef = useRef(validate);
  const keyRef = useRef(draftKey);
  useEffect(() => {
    valueRef.current = value;
    saveRef.current = save;
    validateRef.current = validate;
    keyRef.current = draftKey;
  });

  const version = useRef(0); // 편집할 때마다 +1
  const savedVersion = useRef(0); // 서버에 반영된 버전
  const inFlight = useRef<Promise<boolean> | null>(null); // 동시에 한 번만 저장(중복 요청 방지)
  const retryable = useRef(true);

  // 이전에 저장되지 못한 초안
  const [initialKey] = useState(draftKey);
  const [initialJson] = useState(() => JSON.stringify(initialValue));
  const rawDraft = useSyncExternalStore(
    noopSubscribe,
    () => readDraftOnce(initialKey),
    () => null,
  );
  useEffect(() => () => void draftCache.delete(initialKey), [initialKey]);

  const pendingDraft = useMemo(() => {
    if (draftDismissed || !rawDraft) return null;
    try {
      const parsed = JSON.parse(rawDraft) as { savedAt?: unknown; value?: unknown };
      const draftValue = parseDraft(parsed.value);
      if (!draftValue || JSON.stringify(draftValue) === initialJson) return null;
      return { value: draftValue, savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : null };
    } catch {
      return null;
    }
  }, [rawDraft, draftDismissed, initialJson, parseDraft]);

  const hasUnsaved = useCallback(() => version.current !== savedVersion.current, []);

  const flush = useCallback(async (): Promise<boolean> => {
    while (inFlight.current) await inFlight.current;
    if (version.current === savedVersion.current) return true;

    const current = valueRef.current;
    const check = validateRef.current(current);
    if (check !== true) {
      setStatus(check === false ? "idle" : "blocked");
      setMessage(check === false ? null : check);
      return false;
    }

    const target = version.current;
    setStatus("saving");
    setMessage(null);
    const task = (async () => {
      try {
        const result = await saveRef.current(current);
        if (result.ok) {
          savedVersion.current = Math.max(savedVersion.current, target);
          if (version.current === savedVersion.current) {
            removeDraft(keyRef.current);
            setStatus("saved");
          } else {
            setStatus("pending"); // 저장 중 더 입력한 내용은 이어서 저장
          }
          return true;
        }
        retryable.current = result.retry;
        setStatus("error");
        setMessage(result.error);
        return false;
      } catch {
        retryable.current = true;
        setStatus("error");
        setMessage(
          typeof navigator !== "undefined" && !navigator.onLine
            ? "오프라인 상태입니다. 연결되면 다시 저장합니다."
            : "저장하지 못했습니다. 내용은 이 기기에 임시 보관되어 있습니다.",
        );
        return false;
      }
    })();
    inFlight.current = task;
    try {
      return await task;
    } finally {
      inFlight.current = null;
    }
  }, []);

  /** 내용이 바뀔 때마다 편집기에서 호출 */
  const markChanged = useCallback(() => {
    version.current += 1;
    setStatus("pending");
    setMessage(null);
    setTick((t) => t + 1);
  }, []);

  // 이 기기에 초안 보관(0.3초 디바운스)
  useEffect(() => {
    if (tick === 0) return;
    const t = window.setTimeout(() => writeDraft(keyRef.current, valueRef.current), 300);
    return () => window.clearTimeout(t);
  }, [tick]);

  // 서버 자동 저장(디바운스), 실패 시 재시도
  useEffect(() => {
    if (!enabled) return;
    if (status === "pending") {
      const t = window.setTimeout(() => void flush(), delay);
      return () => window.clearTimeout(t);
    }
    if (status === "error" && retryable.current) {
      const t = window.setTimeout(() => void flush(), RETRY_DELAY);
      return () => window.clearTimeout(t);
    }
  }, [status, tick, enabled, delay, flush]);

  // 창 닫기·탭 전환·온라인 복귀
  useEffect(() => {
    const keepDraft = () => {
      if (hasUnsaved()) writeDraft(keyRef.current, valueRef.current);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsaved()) return;
      keepDraft();
      e.preventDefault();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      keepDraft();
      if (enabled && hasUnsaved()) void flush();
    };
    const onOnline = () => {
      if (enabled && hasUnsaved()) void flush();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      keepDraft(); // 다른 화면으로 이동할 때도 저장 안 된 내용 보관
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [enabled, flush, hasUnsaved]);

  const dismissDraft = useCallback(
    (removeStored: boolean) => {
      if (removeStored) removeDraft(initialKey);
      setDraftDismissed(true);
    },
    [initialKey],
  );

  return { status, message, markChanged, flush, hasUnsaved, pendingDraft, dismissDraft };
}
