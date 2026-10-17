import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/utils";
import { diaryInputSchema, noteInputSchema, ownerSchema, searchQuerySchema } from "@/lib/validation";

const note = { title: "장보기", content: "", isPinned: false, isFavorite: false, tags: [] as string[] };

describe("메모 입력 검증", () => {
  it("제목과 본문이 모두 비면 거부한다", () => {
    expect(noteInputSchema.safeParse({ ...note, title: "  " }).success).toBe(false);
  });
  it("태그의 # 과 공백을 정리하고 중복을 제거한다", () => {
    const parsed = noteInputSchema.parse({ ...note, tags: ["#일상", " 일상 ", "여행"] });
    expect(parsed.tags).toEqual(["일상", "여행"]);
  });
  it("너무 긴 제목을 거부한다", () => {
    expect(noteInputSchema.safeParse({ ...note, title: "가".repeat(201) }).success).toBe(false);
  });
});

describe("일기 입력 검증", () => {
  const diary = { title: "", content: "좋은 하루", diaryDate: "2026-10-17", mood: "happy", weather: null, isFavorite: false, tags: [] };
  it("기분이 없으면 거부한다", () => {
    expect(diaryInputSchema.safeParse({ ...diary, mood: null }).success).toBe(false);
  });
  it("없는 날짜를 거부한다", () => {
    expect(diaryInputSchema.safeParse({ ...diary, diaryDate: "2026-02-31" }).success).toBe(false);
  });
  it("정상 입력은 통과한다", () => {
    expect(diaryInputSchema.safeParse(diary).success).toBe(true);
  });
});

describe("기타 검증", () => {
  it("잘못된 검색 값은 기본값으로 바꾼다", () => {
    const parsed = searchQuerySchema.parse({ type: "hack", sort: "x", from: "2026-99-99" });
    expect(parsed).toMatchObject({ type: "all", sort: "newest", from: undefined });
  });
  it("소유자 이메일은 소문자로 저장한다", () => {
    expect(ownerSchema.parse({ email: "Me@Example.COM", name: "나", password: "a".repeat(12) }).email).toBe("me@example.com");
  });
  it("외부 주소로의 이동을 막는다", () => {
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("/notes?q=1")).toBe("/notes?q=1");
  });
});
