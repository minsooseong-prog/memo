import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">찾는 기록이 없습니다</h1>
      <p className="max-w-sm text-sm text-muted-foreground">주소가 바뀌었거나 영구 삭제된 기록입니다.</p>
      <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-3" })}>
        대시보드로 가기
      </Link>
    </main>
  );
}
