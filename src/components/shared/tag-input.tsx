"use client";

import { Hash, X } from "lucide-react";
import { useState } from "react";
import { LIMITS } from "@/lib/constants";
import { normalizeTag } from "@/lib/text";

export function TagInput({ value, onChange, disabled }: { value: string[]; onChange: (tags: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState("");
  const full = value.length >= LIMITS.tagsPerRecord;

  function commit(raw: string) {
    setDraft("");
    const next = [...value];
    for (const part of raw.split(",")) {
      const tag = normalizeTag(part).slice(0, LIMITS.tagName);
      if (tag && !next.includes(tag) && next.length < LIMITS.tagsPerRecord) next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Hash aria-hidden className="size-3.5 text-muted-foreground" />
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-0.5 rounded-md bg-accent py-0.5 pl-2 pr-0.5 text-xs text-accent-foreground">
          {tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`${tag} 태그 제거`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="cursor-pointer rounded p-0.5 hover:bg-primary/15"
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return; // 한글 조합 중 Enter 무시
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && commit(draft)}
          disabled={full}
          placeholder={full ? `태그는 ${LIMITS.tagsPerRecord}개까지` : "태그 추가"}
          aria-label="태그 추가"
          maxLength={LIMITS.tagName + 5}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/60"
        />
      )}
    </div>
  );
}
