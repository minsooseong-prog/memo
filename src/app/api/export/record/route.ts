import { exportDiary, exportNote } from "@/lib/data/export";
import { getUnlockedUser } from "@/lib/session";
import { logError, toUserMessage } from "@/lib/errors";
import {
  UTF8_BOM,
  contentDisposition,
  diaryToMarkdown,
  markdownToText,
  noteToMarkdown,
  safeFileName,
} from "@/lib/export-format";
import { displayTitle } from "@/lib/text";
import { idSchema, recordKindSchema } from "@/lib/validation";

// 기록 하나를 Markdown(.md) 또는 텍스트(.txt) 파일로 내려받습니다. ?kind=note|diary&id=…&format=md|txt
export async function GET(request: Request) {
  const user = await getUnlockedUser();
  if (!user) return Response.json({ error: "로그인과 잠금 해제가 필요합니다." }, { status: 401 });

  const query = new URL(request.url).searchParams;
  const kind = query.get("kind");
  const id = query.get("id");
  const kindParsed = recordKindSchema.safeParse(kind);
  const idParsed = idSchema.safeParse(id);
  if (!kindParsed.success || !idParsed.success) return Response.json({ error: "찾을 수 없습니다." }, { status: 404 });
  const format = query.get("format") === "txt" ? "txt" : "md";

  try {
    let markdown: string;
    let baseName: string;
    if (kindParsed.data === "note") {
      const note = await exportNote(user.id, idParsed.data);
      if (!note) return Response.json({ error: "찾을 수 없습니다." }, { status: 404 });
      markdown = noteToMarkdown(note);
      baseName = safeFileName(displayTitle(note.title, ""), "memo");
    } else {
      const diary = await exportDiary(user.id, idParsed.data);
      if (!diary) return Response.json({ error: "찾을 수 없습니다." }, { status: 404 });
      markdown = diaryToMarkdown(diary);
      baseName = safeFileName(`${diary.diaryDate} ${diary.title}`, diary.diaryDate);
    }

    const body = format === "txt" ? UTF8_BOM + markdownToText(markdown) : markdown;
    return new Response(body, {
      headers: {
        "Content-Type": format === "txt" ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8",
        "Content-Disposition": contentDisposition(`${baseName}.${format}`),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    logError("export-record", error);
    return Response.json({ error: toUserMessage(error, "내보내기에 실패했습니다.") }, { status: 500 });
  }
}
