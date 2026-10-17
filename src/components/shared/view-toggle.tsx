import { LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { buildQuery, cn } from "@/lib/utils";

export function ViewToggle({ basePath, view, params }: { basePath: string; view: "card" | "list"; params: Record<string, string | undefined> }) {
  const item = "flex size-8 items-center justify-center rounded-md transition-colors";
  return (
    <div className="flex rounded-lg border bg-card p-0.5" role="group" aria-label="보기 방식">
      <Link
        href={`${basePath}${buildQuery({ ...params, view: undefined })}`}
        aria-label="카드형 보기"
        aria-current={view === "card" ? "true" : undefined}
        className={cn(item, view === "card" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        <LayoutGrid className="size-4" />
      </Link>
      <Link
        href={`${basePath}${buildQuery({ ...params, view: "list" })}`}
        aria-label="리스트형 보기"
        aria-current={view === "list" ? "true" : undefined}
        className={cn(item, view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        <List className="size-4" />
      </Link>
    </div>
  );
}
