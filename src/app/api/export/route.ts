import { exportAll } from "@/lib/data/export";
import { todayKst } from "@/lib/date";
import { getUnlockedUser } from "@/lib/session";
import { logError, toUserMessage } from "@/lib/errors";
import { contentDisposition } from "@/lib/export-format";

// 내 모든 메모와 일기(휴지통 포함)를 JSON 으로 내보냅니다.
export async function GET() {
  const user = await getUnlockedUser();
  if (!user) return Response.json({ error: "로그인과 잠금 해제가 필요합니다." }, { status: 401 });

  try {
    const data = await exportAll(user.id);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": contentDisposition(`my-archive-${todayKst()}.json`),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    logError("export", error);
    return Response.json({ error: toUserMessage(error, "내보내기에 실패했습니다.") }, { status: 500 });
  }
}
