import { Download } from "lucide-react";
import type { Metadata } from "next";
import { LockButton, LogoutButton } from "@/components/layout/account-buttons";
import { ChangePasswordForm, ThemeSetting } from "@/components/settings/settings-forms";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui/surface";
import { PIN_RULES } from "@/lib/constants";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="max-w-2xl">
      <PageHeader title="설정" />
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>계정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">이름 </span>
              {user.name}
            </p>
            <p>
              <span className="text-muted-foreground">이메일 </span>
              {user.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>잠금 비밀번호(PIN)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              로그인한 뒤에도 PIN 을 입력해야 기록을 볼 수 있습니다. 브라우저를 닫거나 {PIN_RULES.idleMinutes}분 동안 아무 조작이 없으면 다시
              잠기고, {PIN_RULES.maxFailures}번 틀리면 {PIN_RULES.lockMinutes}분 동안 입력이 막힙니다.
            </p>
            <p>PIN 을 바꾸려면 npm run pin:hash 로 새 해시를 만들어 환경변수 APP_PIN_HASH 를 교체하세요(README 6장).</p>
            <LockButton label="지금 잠그기" variant="outline" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>화면 테마</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeSetting />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>데이터 내보내기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>모든 메모와 일기(휴지통 포함)를 JSON 파일 하나로 내려받습니다. 기록 하나는 각 편집 화면의 내려받기 버튼으로 .md 나 .txt 로 받을 수 있습니다.</p>
            <a href="/api/export" className={buttonVariants({ variant: "outline" })}>
              <Download /> 전체 JSON 내보내기
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>로그인 비밀번호 변경</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>로그아웃</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoutButton variant="outline" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
