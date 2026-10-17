import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// Better Auth 엔드포인트.
// 브라우저는 /api/auth/sign-in/email 처럼 요청하고, proxy.ts 가 그 요청을
// 이 라우트(/api/better-auth?__ba=/sign-in/email)로 넘깁니다.
// 폴더 이름에 [...all] 같은 특수문자를 쓰지 않기 위한 구조입니다.
const BASE_PATH = "/api/auth";

async function forward(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const subPath = url.searchParams.get("__ba") ?? "";
  if (!subPath.startsWith("/") || subPath.includes("..")) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 404 });
  }
  url.searchParams.delete("__ba");
  url.pathname = `${BASE_PATH}${subPath}`;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const original = new Request(url, {
    method: request.method,
    headers: request.headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });

  const handler = toNextJsHandler(getAuth());
  return request.method === "GET" ? handler.GET(original) : handler.POST(original);
}

export const GET = forward;
export const POST = forward;
