"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** 클라이언트에서 마운트된 뒤에만 true (테마처럼 서버가 알 수 없는 값을 안전하게 표시) */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
