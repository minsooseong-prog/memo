// 날짜 규칙
// - 일기 날짜(diary_date): 한국 날짜 "YYYY-MM-DD" 문자열(DATE 타입)
// - 생성/수정 시각: UTC timestamptz 로 저장, 화면에는 Asia/Seoul 로 표시
export const TIME_ZONE = "Asia/Seoul";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function seoulParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: Number(get("hour")) };
}

/** 특정 시각의 한국 날짜 (YYYY-MM-DD) */
export function toKstDate(date: Date): string {
  const p = seoulParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

export function todayKst(): string {
  return toKstDate(new Date());
}

export function hourKst(): number {
  return seoulParts(new Date()).hour;
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isValidMonthString(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export function weekdayLabel(dateStr: string): string {
  return WEEKDAYS[weekdayOf(dateStr)];
}

export function monthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${ym}-01`, end: `${ym}-${String(lastDay).padStart(2, "0")}` };
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** 한국 날짜 하루의 시작/끝을 UTC 시각으로 (검색 날짜 범위용) */
export function kstDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000+09:00`);
}
export function kstDayEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+09:00`);
}

export function formatKoreanDate(dateStr: string, withWeekday = true): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = `${y}년 ${m}월 ${d}일`;
  return withWeekday ? `${base} ${weekdayLabel(dateStr)}요일` : base;
}

export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${y}년 ${m}월`;
}

export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** 목록용 짧은 표기: 오늘이면 시각, 올해면 월/일, 아니면 연.월.일 */
export function formatRelativeShort(value: Date | string, now: Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const day = toKstDate(date);
  const today = toKstDate(now);
  if (day === today) {
    return new Intl.DateTimeFormat("ko-KR", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(date);
  }
  const [y, m, d] = day.split("-").map(Number);
  return day.slice(0, 4) === today.slice(0, 4) ? `${m}월 ${d}일` : `${y}. ${m}. ${d}.`;
}
