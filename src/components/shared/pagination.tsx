import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buildQuery, cn } from "@/lib/utils";

export function Pagination({
  basePath,
  page,
  totalPages,
  params,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => `${basePath}${buildQuery({ ...params, page: p > 1 ? p : undefined })}`;
  const item = "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm";
  return (
    <nav aria-label="페이지" className="mt-8 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} aria-label="이전 페이지" className={cn(item, "hover:bg-muted")}>
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-30")}>
          <ChevronLeft className="size-4" />
        </span>
      )}
      <span className="px-3 text-sm tabular-nums text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} aria-label="다음 페이지" className={cn(item, "hover:bg-muted")}>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-30")}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
