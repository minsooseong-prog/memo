"use client";

import { MOODS, WEATHERS, type Mood, type Weather } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MoodPicker({ value, onChange, disabled }: { value: Mood | null; onChange: (m: Mood) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="오늘의 기분" className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
      {MOODS.map((m) => {
        const selected = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(m.value)}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-xs transition-all disabled:cursor-default",
              selected ? "border-primary bg-accent font-medium text-accent-foreground" : "border-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            <span className={cn("text-2xl transition-transform", selected && "scale-110")}>{m.emoji}</span>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

/** 같은 날씨를 다시 누르면 선택 해제 */
export function WeatherPicker({ value, onChange, disabled }: { value: Weather | null; onChange: (w: Weather | null) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="날씨" className="flex flex-wrap gap-1.5">
      {WEATHERS.map((w) => {
        const selected = value === w.value;
        return (
          <button
            key={w.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(selected ? null : w.value)}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-default",
              selected ? "border-primary bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <span aria-hidden>{w.emoji}</span>
            {w.label}
          </button>
        );
      })}
    </div>
  );
}
