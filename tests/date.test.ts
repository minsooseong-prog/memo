import { describe, expect, it } from "vitest";
import { addDays, isValidDateString, isValidMonthString, kstDayEnd, kstDayStart, monthRange, shiftMonth, toKstDate, weekdayLabel } from "@/lib/date";

describe("한국 시간 날짜 처리", () => {
  it("UTC 오후 3시 이후는 한국 날짜로 다음 날이다", () => {
    expect(toKstDate(new Date("2026-01-01T14:59:59Z"))).toBe("2026-01-01");
    expect(toKstDate(new Date("2026-01-01T15:00:00Z"))).toBe("2026-01-02");
  });

  it("날짜 문자열을 엄격하게 검증한다", () => {
    expect(isValidDateString("2026-02-28")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-2-3")).toBe(false);
    expect(isValidMonthString("2026-12")).toBe(true);
    expect(isValidMonthString("2026-13")).toBe(false);
  });

  it("월 범위와 이동을 계산한다", () => {
    expect(monthRange("2028-02")).toEqual({ start: "2028-02-01", end: "2028-02-29" });
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(weekdayLabel("2026-10-17")).toBe("토");
  });

  it("한국 날짜의 하루 범위를 UTC 로 바꾼다", () => {
    expect(kstDayStart("2026-03-01").toISOString()).toBe("2026-02-28T15:00:00.000Z");
    expect(kstDayEnd("2026-03-01").toISOString()).toBe("2026-03-01T14:59:59.999Z");
  });
});
