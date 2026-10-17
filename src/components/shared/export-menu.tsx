"use client";

import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { exportHref } from "@/lib/routes";

/** 기록 하나를 .md / .txt 로 내려받는 메뉴 */
export function ExportMenu({ kind, id }: { kind: "note" | "diary"; id: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" aria-label="파일로 내보내기" title="파일로 내보내기" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Download />
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-40 w-44 overflow-hidden rounded-lg border bg-popover py-1 text-sm shadow-lg">
          <a role="menuitem" href={exportHref(kind, id, "md")} onClick={() => setOpen(false)} className="block px-3 py-2 hover:bg-muted">
            Markdown (.md)
          </a>
          <a role="menuitem" href={exportHref(kind, id, "txt")} onClick={() => setOpen(false)} className="block px-3 py-2 hover:bg-muted">
            텍스트 (.txt)
          </a>
        </div>
      )}
    </div>
  );
}
