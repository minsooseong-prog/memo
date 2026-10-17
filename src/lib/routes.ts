// 화면·파일 주소를 한곳에서 만듭니다.
// (폴더 이름에 [ ] ( ) ... 같은 특수문자를 쓰지 않기 위해 기록 id 는 주소의 ?id= 로 전달합니다)
export const noteHref = (id: string) => `/notes/edit?id=${id}`;
export const diaryHref = (id: string) => `/diary/edit?id=${id}`;
export const recordHref = (kind: "note" | "diary", id: string) => (kind === "note" ? noteHref(id) : diaryHref(id));
export const exportHref = (kind: "note" | "diary", id: string, format: "md" | "txt") =>
  `/api/export/record?kind=${kind}&id=${id}&format=${format}`;
