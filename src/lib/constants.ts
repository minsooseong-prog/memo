export const APP_NAME = "My Archive";

export const MOOD_VALUES = ["happy", "excited", "calm", "neutral", "tired", "sad", "angry", "anxious"] as const;
export type Mood = (typeof MOOD_VALUES)[number];

export const MOOD_META: Record<Mood, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "행복" },
  excited: { emoji: "🤩", label: "설렘" },
  calm: { emoji: "😌", label: "평온" },
  neutral: { emoji: "😐", label: "보통" },
  tired: { emoji: "😴", label: "피곤" },
  sad: { emoji: "😢", label: "슬픔" },
  angry: { emoji: "😠", label: "화남" },
  anxious: { emoji: "😟", label: "불안" },
};

export const MOODS = MOOD_VALUES.map((value) => ({ value, ...MOOD_META[value] }));

export const WEATHER_VALUES = ["sunny", "partly_cloudy", "cloudy", "rainy", "snowy", "stormy", "windy", "foggy"] as const;
export type Weather = (typeof WEATHER_VALUES)[number];

export const WEATHER_META: Record<Weather, { emoji: string; label: string }> = {
  sunny: { emoji: "☀️", label: "맑음" },
  partly_cloudy: { emoji: "⛅", label: "구름 조금" },
  cloudy: { emoji: "☁️", label: "흐림" },
  rainy: { emoji: "🌧️", label: "비" },
  snowy: { emoji: "❄️", label: "눈" },
  stormy: { emoji: "⛈️", label: "천둥번개" },
  windy: { emoji: "🌬️", label: "바람" },
  foggy: { emoji: "🌫️", label: "안개" },
};

export const WEATHERS = WEATHER_VALUES.map((value) => ({ value, ...WEATHER_META[value] }));

export const LIMITS = {
  title: 200,
  content: 200_000,
  tagName: 30,
  tagsPerRecord: 20,
  query: 100,
  passwordMin: 12,
  passwordMax: 128,
} as const;

export const NOTE_SORTS = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "title", label: "제목순" },
] as const;
export type NoteSort = (typeof NOTE_SORTS)[number]["value"];

export const SEARCH_TYPES = [
  { value: "all", label: "전체" },
  { value: "note", label: "메모" },
  { value: "diary", label: "일기" },
] as const;
export type SearchType = (typeof SEARCH_TYPES)[number]["value"];

export const PAGE_SIZE = 24;

/** 2차 잠금(PIN) */
export const UNLOCK_COOKIE = "ma_unlock";
export const PIN_RULES = {
  unlockHours: 12, // 잠금 해제 유지 시간(브라우저를 닫으면 즉시 만료)
  maxFailures: 5, // 연속 실패 허용 횟수
  lockMinutes: 15, // 초과 시 잠금 시간
  idleMinutes: 15, // 아무 조작이 없으면 자동 잠금
} as const;
