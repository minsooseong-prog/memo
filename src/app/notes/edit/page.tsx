import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoteEditor } from "@/components/notes/note-editor";
import { getNote } from "@/lib/data/notes";
import { displayTitle } from "@/lib/text";
import { firstParam, type SearchParams } from "@/lib/utils";
import { idSchema } from "@/lib/validation";

type Props = { searchParams: SearchParams };

async function load(searchParams: SearchParams) {
  const id = firstParam((await searchParams).id) ?? "";
  return idSchema.safeParse(id).success ? getNote(id) : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const note = await load(searchParams);
  return { title: note ? displayTitle(note.title) : "메모" };
}

export default async function EditNotePage({ searchParams }: Props) {
  const note = await load(searchParams);
  if (!note) notFound();
  return (
    <NoteEditor
      key={note.id}
      id={note.id}
      isNew={false}
      deleted={note.deletedAt !== null}
      createdAt={note.createdAt.toISOString()}
      updatedAt={note.updatedAt.toISOString()}
      initial={{ title: note.title, content: note.content, isPinned: note.isPinned, isFavorite: note.isFavorite, tags: note.tags }}
    />
  );
}
