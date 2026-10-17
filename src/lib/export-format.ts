import { MOOD_META, WEATHER_META, type Mood, type Weather } from "./constants";
import { formatDateTime, formatKoreanDate } from "./date";
import { displayTitle } from "./text";

export type ExportNote = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ExportDiary = {
  id: string;
  title: string;
  content: string;
  diaryDate: string;
  mood: Mood;
  weather: Weather | null;
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export function noteToMarkdown(n: ExportNote): string {
  const lines = [`# ${displayTitle(n.title)}`, ""];
  if (n.tags.length) lines.push(`태그: ${n.tags.map((t) => `#${t}`).join(" ")}`);
  lines.push(`작성: ${formatDateTime(n.createdAt)}`, `수정: ${formatDateTime(n.updatedAt)}`, "", "---", "", n.content);
  return `${lines.join("\n").trimEnd()}\n`;
}

export function diaryToMarkdown(d: ExportDiary): string {
  const mood = MOOD_META[d.mood];
  const weather = d.weather ? WEATHER_META[d.weather] : null;
  const lines = [`# ${displayTitle(d.title, formatKoreanDate(d.diaryDate))}`, "", `날짜: ${formatKoreanDate(d.diaryDate)}`];
  lines.push(`기분: ${mood.emoji} ${mood.label}`);
  if (weather) lines.push(`날씨: ${weather.emoji} ${weather.label}`);
  if (d.tags.length) lines.push(`태그: ${d.tags.map((t) => `#${t}`).join(" ")}`);
  lines.push(`작성: ${formatDateTime(d.createdAt)}`, `수정: ${formatDateTime(d.updatedAt)}`, "", "---", "", d.content);
  return `${lines.join("\n").trimEnd()}\n`;
}

/** TXT 는 마크다운 문서에서 제목 기호만 정리합니다(본문 서식 기호는 그대로 둡니다). */
export function markdownToText(markdown: string): string {
  return markdown.replace(/^# /, "").replace(/\n---\n/, `\n${"-".repeat(30)}\n`);
}

/** 파일 이름에 쓸 수 없는 문자를 제거합니다. */
export function safeFileName(title: string, fallback: string): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return cleaned || fallback;
}

/** 한글 파일명을 지원하는 Content-Disposition 헤더 (RFC 6266 / 5987) */
export function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export const UTF8_BOM = "\uFEFF";
