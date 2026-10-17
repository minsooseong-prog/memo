/** 마크다운 본문에서 미리보기용 평문을 뽑습니다. */
export function toExcerpt(markdown: string, max = 120): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]\s+\[[ xX]\]|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~`|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

export function displayTitle(title: string, fallback = "제목 없음"): string {
  return title.trim() || fallback;
}

/** LIKE/ILIKE 패턴의 와일드카드를 이스케이프합니다. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** 태그 이름 정규화: 앞의 #, 쉼표 제거, 공백 정리 */
export function normalizeTag(raw: string): string {
  return raw.replace(/^#+/, "").replace(/[,\n\r]/g, " ").replace(/\s+/g, " ").trim();
}
