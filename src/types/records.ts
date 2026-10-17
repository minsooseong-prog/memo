import type { Mood, Weather } from "@/lib/constants";

export type NoteSummary = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
};

export type DiarySummary = {
  id: string;
  title: string;
  content: string;
  diaryDate: string;
  mood: Mood;
  weather: Weather | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export type SaveResult = { ok: true; updatedAt: string } | { ok: false; error: string; retry: boolean };
