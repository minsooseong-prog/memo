// Next.js 16 Proxy(구 middleware)
//   /api/auth/*          → 로그인 처리 라우트(/api/better-auth)로 전달
//   로그인 쿠키가 없으면  → /login
//   PIN 해제 쿠키가 없으면 → /unlock
// 쿠키 "존재"만 보는 1차 차단이며, 서명·만료·DB 세션 검증은 서버 코드(requireUser)가 합니다.
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { UNLOCK_COOKIE } from "@/lib/constants";

function deny(request: NextRequest, target: "/login" | "/unlock", message: string) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: message }, { status: 401 });
  const url = new URL(target, request.url);
  if (pathname !== "/" && pathname !== target) url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/better-auth";
    url.searchParams.set("__ba", pathname.slice("/api/auth".length));
    return NextResponse.rewrite(url);
  }

  if (pathname === "/login") return NextResponse.next();
  if (!getSessionCookie(request)) return deny(request, "/login", "로그인이 필요합니다.");
  if (pathname === "/unlock") return NextResponse.next();
  if (!request.cookies.has(UNLOCK_COOKIE)) return deny(request, "/unlock", "잠금 해제가 필요합니다.");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
