import { createAuthClient } from "better-auth/react";

// 같은 사이트의 /api/auth 로 요청합니다(baseURL 생략 시 현재 주소 사용).
export const authClient = createAuthClient();
