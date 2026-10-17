import { Pin, Star } from "lucide-react";
import Link from "next/link";
import { formatRelativeShort } from "@/lib/date";
import { displayTitle, toExcerpt } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { NoteSummary } from "@/types/records";
import { NoteQuickActions } from "./note-quick-actions";
import { noteHref } from "@/lib/routes";

function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((t) => (
        <span key={t} className="rounded bg-accent px-1.5 py-0.5 text-[0.7rem] text-accent-foreground">
          #{t}
        </span>
      ))}
      {tags.length > 3 && <span className="text-[0.7rem] text-muted-foreground">+{tags.length - 3}</span>}
    </span>
  );
}

/** 카드형 메모 */
export function NoteCard({ note, withActions = true }: { note: NoteSummary; withActions?: boolean }) {
  return (
    <div className="group relative flex flex-col rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={noteHref(note.id)} className="flex flex-1 flex-col p-4 pb-3">
        <span className="flex items-center gap-1.5 pr-20">
          {note.isPinned && <Pin aria-label="고정됨" className="size-3.5 shrink-0 fill-highlight text-highlight" />}
          {note.isFavorite && <Star aria-label="즐겨찾기" className="size-3.5 shrink-0 fill-highlight text-highlight" />}
          <span className="line-clamp-1 font-medium">{displayTitle(note.title)}</span>
        </span>
        <span className="mt-1.5 line-clamp-4 flex-1 text-sm leading-6 text-muted-foreground">{toExcerpt(note.content, 180) || "내용 없음"}</span>
        <span className="mt-3 flex items-end justify-between gap-2">
          <Tags tags={note.tags} />
          <time className="shrink-0 text-xs text-muted-foreground" dateTime={note.updatedAt.toISOString()}>
            {formatRelativeShort(note.updatedAt)}
          </time>
        </span>
      </Link>
      {withActions && (
        <NoteQuickActions
          id={note.id}
          isPinned={note.isPinned}
          isFavorite={note.isFavorite}
          className="absolute right-1.5 top-1.5 rounded-lg bg-card/90 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        />
      )}
    </div>
  );
}

/** 리스트형 메모 */
export function NoteRow({ note }: { note: NoteSummary }) {
  return (
    <li className="group flex items-center gap-2 px-2 transition-colors hover:bg-muted/60">
      <Link href={noteHref(note.id)} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-2">
        <span className={cn("flex w-4 shrink-0 justify-center", !note.isPinned && "invisible")}>
          <Pin aria-label="고정됨" className="size-3.5 fill-highlight text-highlight" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-medium">{displayTitle(note.title)}</span>
            {note.isFavorite && <Star aria-label="즐겨찾기" className="size-3.5 shrink-0 fill-highlight text-highlight" />}
          </span>
          <span className="block truncate text-sm text-muted-foreground">{toExcerpt(note.content, 100) || "내용 없음"}</span>
        </span>
        <span className="hidden sm:block">
          <Tags tags={note.tags} />
        </span>
        <time className="w-20 shrink-0 text-right text-xs text-muted-foreground" dateTime={note.updatedAt.toISOString()}>
          {formatRelativeShort(note.updatedAt)}
        </time>
      </Link>
      <NoteQuickActions id={note.id} isPinned={note.isPinned} isFavorite={note.isFavorite} className="transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100" />
    </li>
  );
}

export function NoteCollection({ notes, view }: { notes: NoteSummary[]; view: "card" | "list" }) {
  if (view === "list") {
    return (
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {notes.map((n) => (
          <NoteRow key={n.id} note={n} />
        ))}
      </ul>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} />
      ))}
    </div>
  );
}
