import { describe, expect, it } from "vitest";
import { contentDisposition, diaryToMarkdown, markdownToText, noteToMarkdown, safeFileName } from "@/lib/export-format";

const at = new Date("2026-10-17T01:00:00Z");

describe("내보내기 형식", () => {
  it("메모를 한국어 마크다운으로 만든다", () => {
    const md = noteToMarkdown({ id: "1", title: "회의 메모", content: "**중요**", isPinned: false, isFavorite: false, tags: ["업무"], createdAt: at, updatedAt: at });
    expect(md.startsWith("# 회의 메모\n")).toBe(true);
    expect(md).toContain("#업무");
    expect(md).toContain("**중요**");
  });

  it("일기에 기분과 날짜를 넣는다", () => {
    const md = diaryToMarkdown({ id: "1", title: "", content: "본문", diaryDate: "2026-10-17", mood: "happy", weather: "sunny", isFavorite: false, tags: [], createdAt: at, updatedAt: at });
    expect(md).toContain("2026년 10월 17일 토요일");
    expect(md).toContain("😊 행복");
    expect(markdownToText(md).startsWith("2026년")).toBe(true);
  });

  it("파일 이름에서 쓸 수 없는 문자를 지운다", () => {
    expect(safeFileName('a/b:c*"d"', "x")).toBe("a b c d");
    expect(safeFileName("   ", "memo")).toBe("memo");
  });

  it("한글 파일명을 RFC 5987 형식으로 인코딩한다", () => {
    const header = contentDisposition("일기.md");
    expect(header).toContain(`filename*=UTF-8''${encodeURIComponent("일기.md")}`);
    expect(header).toMatch(/filename="[\x20-\x7e]+"/);
  });
});
