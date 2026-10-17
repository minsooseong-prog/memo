import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoteEditor } from "@/components/notes/note-editor";
import { getNote } from "@/lib/data/notes";
import { displayTitle } from "@/lib/text";
import { idSchema } from "@/lib/validation";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  return idSchema.safeParse(id).success ? getNote(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const note = await load((await params).id);
  return { title: note ? displayTitle(note.title) : "메모" };
}

export default async function NotePage({ params }: Props) {
  const note = await load((await params).id);
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
