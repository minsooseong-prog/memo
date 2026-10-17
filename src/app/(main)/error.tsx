"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const env = error.message.includes("환경변수");
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-lg font-semibold">화면을 불러오지 못했습니다</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {env
          ? "서버 환경변수 설정을 확인해 주세요. 자세한 내용은 서버 로그와 README의 문제 해결 장에 있습니다."
          : "데이터베이스 연결이 잠시 불안정할 수 있습니다. 작성 중이던 글은 이 기기에 임시 보관되어 있습니다."}
      </p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground">오류 번호: {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        <RotateCw /> 다시 시도
      </Button>
    </div>
  );
}
