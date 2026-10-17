// 사용자에게 보여줄 오류 문구와 서버 로그를 분리합니다.
// 로그에는 오류 종류와 메시지만 남기고, 메모/일기 내용이나 입력값은 기록하지 않습니다.

const CONNECTION_HINTS = ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "fetch failed", "WebSocket", "Connection terminated", "timeout"];

export function isConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return CONNECTION_HINTS.some((hint) => message.includes(hint));
}

export function toUserMessage(error: unknown, fallback = "요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요."): string {
  if (isConnectionError(error)) return "데이터베이스에 연결하지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.";
  return fallback;
}

export function logError(scope: string, error: unknown): void {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : "unknown error";
  console.error(`[${scope}] ${message.slice(0, 300)}`);
}
