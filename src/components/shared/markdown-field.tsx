"use client";

import { Bold, CheckSquare, Code, Eye, Heading2, Italic, Link2, List, ListOrdered, PenLine, Quote } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MarkdownView } from "./markdown-view";

type Format = "bold" | "italic" | "h2" | "ul" | "ol" | "task" | "quote" | "code" | "link";

const TOOLS: { kind: Format; label: string; icon: typeof Bold }[] = [
  { kind: "h2", label: "소제목", icon: Heading2 },
  { kind: "bold", label: "굵게", icon: Bold },
  { kind: "italic", label: "기울임", icon: Italic },
  { kind: "ul", label: "글머리 목록", icon: List },
  { kind: "ol", label: "번호 목록", icon: ListOrdered },
  { kind: "task", label: "체크리스트", icon: CheckSquare },
  { kind: "quote", label: "인용", icon: Quote },
  { kind: "code", label: "코드", icon: Code },
  { kind: "link", label: "링크", icon: Link2 },
];

/** 텍스트 선택 영역에 마크다운 서식을 적용합니다. */
function applyFormat(value: string, start: number, end: number, kind: Format) {
  const inline: Partial<Record<Format, [string, string, string]>> = {
    bold: ["**", "**", "굵은 글씨"],
    italic: ["*", "*", "기울인 글씨"],
    code: ["`", "`", "코드"],
    link: ["[", "](https://)", "링크 이름"],
  };
  const wrap = inline[kind];
  if (wrap) {
    const [before, after, placeholder] = wrap;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    const s = start + before.length;
    return { next, selStart: s, selEnd: s + selected.length };
  }
  const lineStart = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = value.indexOf("\n", end);
  if (lineEnd === -1) lineEnd = value.length;
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const prefix = (i: number) =>
    kind === "h2" ? "## " : kind === "ul" ? "- " : kind === "ol" ? `${i + 1}. ` : kind === "task" ? "- [ ] " : "> ";
  const all = lines.every((l, i) => l.startsWith(prefix(i)));
  const block = lines.map((l, i) => (all ? l.slice(prefix(i).length) : prefix(i) + l)).join("\n");
  return { next: value.slice(0, lineStart) + block + value.slice(lineEnd), selStart: lineStart, selEnd: lineStart + block.length };
}

export function MarkdownField({
  value,
  onChange,
  placeholder,
  serif = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  serif?: boolean;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<"write" | "preview">(disabled ? "preview" : "write");
  const ref = useRef<HTMLTextAreaElement>(null);

  function format(kind: Format) {
    const ta = ref.current;
    if (!ta) return;
    const { next, selStart, selEnd } = applyFormat(ta.value, ta.selectionStart, ta.selectionEnd, kind);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  return (
    <div>
      <div className="sticky top-14 z-10 -mx-1 flex items-center gap-0.5 overflow-x-auto bg-background/90 px-1 py-1.5 backdrop-blur md:top-0">
        <div role="tablist" aria-label="본문 보기" className="mr-1 flex shrink-0 rounded-lg bg-muted p-0.5">
          {(
            [
              { id: "write", label: "쓰기", icon: PenLine },
              { id: "preview", label: "미리보기", icon: Eye },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              disabled={disabled && id === "write"}
              onClick={() => setMode(id)}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40",
                mode === id ? "bg-card font-medium shadow-xs" : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        {mode === "write" &&
          TOOLS.map(({ kind, label, icon: Icon }) => (
            <Button
              key={kind}
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              title={label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format(kind)}
              className="text-muted-foreground"
            >
              <Icon />
            </Button>
          ))}
      </div>

      {mode === "write" ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={LIMITS.content}
          aria-label="본문"
          className={cn(
            "mt-2 block min-h-[50vh] w-full resize-none bg-transparent text-[0.98rem] leading-7 outline-none [field-sizing:content] placeholder:text-muted-foreground/50",
            serif && "font-serif text-[1.02rem] leading-8",
          )}
        />
      ) : (
        <div className="mt-3 min-h-[50vh]">
          {value.trim() ? <MarkdownView content={value} serif={serif} /> : <p className="text-sm text-muted-foreground">아직 내용이 없습니다.</p>}
        </div>
      )}
    </div>
  );
}
