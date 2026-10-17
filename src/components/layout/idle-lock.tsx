"use client";

import { useEffect } from "react";
import { lockAction } from "@/actions/lock";
import { PIN_RULES } from "@/lib/constants";

/** 일정 시간 아무 조작이 없으면 자동으로 PIN 잠금을 겁니다(작성 중인 글은 이 기기에 임시 보관됨). */
export function IdleLock() {
  useEffect(() => {
    const limit = PIN_RULES.idleMinutes * 60_000;
    let last = Date.now();
    let locked = false;
    const lock = () => {
      if (locked) return;
      locked = true;
      void lockAction();
    };
    const touch = () => {
      last = Date.now();
    };
    const check = () => {
      if (Date.now() - last >= limit) lock();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(check, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
