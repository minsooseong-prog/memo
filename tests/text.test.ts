import { describe, expect, it } from "vitest";
import { displayTitle, escapeLike, normalizeTag, toExcerpt } from "@/lib/text";

describe("텍스트 유틸", () => {
  it("마크다운 기호를 걷어 낸 미리보기를 만든다", () => {
    expect(toExcerpt("# 제목\n- **굵게** [링크](https://a.b)")).toBe("제목 굵게 링크");
  });
  it("LIKE 와일드카드를 이스케이프한다", () => {
    expect(escapeLike("100%_\\")).toBe("100\\%\\_\\\\");
  });
  it("태그와 제목을 정리한다", () => {
    expect(normalizeTag("##여행,  계획")).toBe("여행 계획");
    expect(displayTitle("  ")).toBe("제목 없음");
  });
});
