import { BookHeart, FilePlus2, NotebookPen, PenLine, Star } from "lucide-react";
import Link from "next/link";
import { DiaryCard } from "@/components/diary/diary-card";
import { NoteCard } from "@/components/notes/note-item";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboard, type Activity } from "@/lib/data/overview";
import { formatKoreanDate, formatRelativeShort, hourKst } from "@/lib/date";
import { displayTitle } from "@/lib/text";

function greeting(hour: number) {
  if (hour < 5) return "늦은 밤이에요";
  if (hour < 11) return "좋은 아침이에요";
  if (hour < 17) return "좋은 오후예요";
  return "편안한 저녁이에요";
}

const ACTION_LABEL: Record<Activity["action"], string> = { created: "작성", updated: "수정", trashed: "휴지통으로 이동" };

function recordHref(kind: "note" | "diary", id: string) {
  return kind === "note" ? `/notes/${id}` : `/diary/${id}`;
}

export default async function DashboardPage() {
  const data = await getDashboard();

  return (
    <div className="space-y-8">
      <section className="animate-rise">
        <p className="text-sm text-muted-foreground">{formatKoreanDate(data.today)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          {greeting(hourKst())}, {data.user.name}님
        </h1>
        <p className="mt-2 text-muted-foreground">
          {data.wroteToday ? "오늘의 일기를 남겼어요. 떠오르는 생각은 메모로 붙잡아 두세요." : "오늘 하루를 몇 줄로 남겨 볼까요?"}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/notes/new" className={buttonVariants({ size: "lg" })}>
            <FilePlus2 /> 빠른 메모
          </Link>
          <Link href="/diary/new" className={buttonVariants({ size: "lg", variant: "outline" })}>
            <PenLine /> 오늘의 일기 쓰기
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="기록 수">
        <Link href="/notes" className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <NotebookPen className="size-4" /> 전체 메모
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.noteCount}</p>
        </Link>
        <Link href="/diary" className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookHeart className="size-4" /> 전체 일기
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.diaryCount}</p>
        </Link>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-semibold">최근 메모</h2>
              {data.noteCount > 0 && (
                <Link href="/notes" className="text-sm text-primary hover:underline">
                  모두 보기
                </Link>
              )}
            </div>
            {data.recentNotes.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.recentNotes.map((n) => (
                  <NoteCard key={n.id} note={n} withActions={false} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={NotebookPen}
                title="아직 메모가 없어요"
                description="스쳐 지나가는 생각, 할 일, 아이디어를 가볍게 적어 두세요."
                action={
                  <Link href="/notes/new" className={buttonVariants({ size: "sm" })}>
                    첫 메모 쓰기
                  </Link>
                }
              />
            )}
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-semibold">최근 일기</h2>
              {data.diaryCount > 0 && (
                <Link href="/diary/calendar" className="text-sm text-primary hover:underline">
                  캘린더로 보기
                </Link>
              )}
            </div>
            {data.recentDiaries.length ? (
              <div className="space-y-3">
                {data.recentDiaries.map((d) => (
                  <DiaryCard key={d.id} diary={d} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookHeart}
                title="첫 일기를 기다리고 있어요"
                description="오늘의 기분과 날씨, 기억하고 싶은 순간을 남겨 보세요."
                action={
                  <Link href="/diary/new" className={buttonVariants({ size: "sm" })}>
                    오늘의 일기 쓰기
                  </Link>
                }
              />
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Star className="size-4 fill-highlight text-highlight" /> 즐겨찾기
              </CardTitle>
              {data.favorites.length > 0 && (
                <Link href="/favorites" className="text-xs text-primary hover:underline">
                  전체
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {data.favorites.length ? (
                <ul className="space-y-1">
                  {data.favorites.map((f) => (
                    <li key={`${f.kind}-${f.id}`}>
                      <Link href={recordHref(f.kind, f.id)} className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        {f.kind === "note" ? <NotebookPen className="size-3.5 text-muted-foreground" /> : <BookHeart className="size-3.5 text-muted-foreground" />}
                        <span className="truncate">{displayTitle(f.title, f.kind === "diary" ? `${f.diaryDate} 일기` : "제목 없음")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">별표를 누른 기록이 여기에 모입니다.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
            </CardHeader>
            <CardContent>
              {data.activity.length ? (
                <ol className="space-y-3">
                  {data.activity.map((a) => (
                    <li key={`${a.kind}-${a.id}`} className="flex gap-3 text-sm">
                      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                      <div className="min-w-0">
                        {a.action === "trashed" ? (
                          <span className="block truncate text-muted-foreground line-through">{displayTitle(a.title, a.diaryDate ? `${a.diaryDate} 일기` : "제목 없음")}</span>
                        ) : (
                          <Link href={recordHref(a.kind, a.id)} className="block truncate hover:underline">
                            {displayTitle(a.title, a.diaryDate ? `${a.diaryDate} 일기` : "제목 없음")}
                          </Link>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {a.kind === "note" ? "메모" : "일기"} {ACTION_LABEL[a.action]}, {formatRelativeShort(a.at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">기록을 남기면 활동이 여기에 쌓입니다.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
