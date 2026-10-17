# My Archive

나만 쓰는 비공개 메모장 + 일기장입니다. GitHub → Vercel 자동 배포, 데이터는 Neon PostgreSQL에 영구 저장됩니다.

- Next.js 16 (App Router, Server Actions, `proxy.ts`) · React 19 · TypeScript strict
- Tailwind CSS v4 · shadcn/ui 규칙의 컴포넌트(`components.json` 포함, `npx shadcn add` 로 확장 가능) · Lucide
- Neon PostgreSQL · `@neondatabase/serverless`(WebSocket Pool, 트랜잭션 지원) · Drizzle ORM / Drizzle Kit
- Better Auth(이메일·비밀번호, 공개 가입 차단, DB 기반 로그인 시도 제한) · **PIN 2차 잠금**
- Zod v4 입력 검증 · Vitest 테스트 · ESLint(flat config)

---

## 목차

1. [개발 환경 준비](#1-개발-환경-준비)
2. [npm install](#2-npm-install)
3. [환경변수 설정](#3-환경변수-설정)
4. [Neon DB 연결](#4-neon-db-연결)
5. [데이터베이스 마이그레이션](#5-데이터베이스-마이그레이션)
6. [최초 소유자 계정과 잠금 PIN 만들기](#6-최초-소유자-계정과-잠금-pin-만들기)
7. [로컬 실행과 로그인 테스트](#7-로컬-실행과-로그인-테스트)
8. [GitHub에 업로드](#8-github에-업로드)
9. [Vercel에서 저장소 연결](#9-vercel에서-저장소-연결)
10. [Vercel Marketplace에서 Neon 무료 플랜 연결](#10-vercel-marketplace에서-neon-무료-플랜-연결)
11. [Production 환경변수 확인](#11-production-환경변수-확인)
12. [Production 배포](#12-production-배포)
13. [배포 후 저장·재접속 테스트](#13-배포-후-저장재접속-테스트)
14. [코드 수정 후 자동 재배포](#14-코드-수정-후-자동-재배포)
15. [자주 발생하는 오류](#15-자주-발생하는-오류)
16. [구조와 보안 설계](#16-구조와-보안-설계)

> **이 저장소의 검증 상태**: 코드는 패키지를 설치할 수 없는 환경에서 작성되어 `npm install`·`npm run build`·`npm run lint`·DB 연결을 **실행해 보지 못했습니다.** 구문 검사(107개 파일)와 외부 패키지가 필요 없는 테스트 17개(날짜, 텍스트, 내보내기 형식, PIN 토큰)는 통과했습니다. 2장의 `npm run verify` 로 꼭 확인해 주세요. `package-lock.json` 도 같은 이유로 포함되어 있지 않으며, `npm install` 을 처음 실행하면 생성되니 함께 커밋하세요.

---

## 1. 개발 환경 준비

- **Node.js 22 LTS** (최소 20.9): https://nodejs.org → LTS 설치
- **Git**: https://git-scm.com
- **VS Code**(권장)
- 확인 (PowerShell):

```powershell
node -v      # v22.x
npm -v
git --version
```

## 2. npm install

```powershell
cd C:\dev\my-archive        # 압축을 푼 폴더
npm install                 # package-lock.json 생성
npm run test                # 단위 테스트
npm run typecheck           # 타입 검사
npm run lint                # ESLint
```

설치가 버전 문제로 실패하면 최신 안정 버전으로 맞춥니다.

```powershell
npm install next@latest react@latest react-dom@latest better-auth@latest drizzle-orm@latest @neondatabase/serverless@latest zod@latest
npm install -D drizzle-kit@latest eslint-config-next@latest vitest@latest
```

## 3. 환경변수 설정

```powershell
Copy-Item .env.example .env.local
npm run gen-secret          # 출력값 → BETTER_AUTH_SECRET
notepad .env.local
```

| 변수 | 내용 |
| --- | --- |
| `DATABASE_URL` | Neon 연결 문자열(풀러 주소, 앱 실행용) |
| `DATABASE_URL_UNPOOLED` | Neon 직접 연결 주소(마이그레이션용, 비워 두면 `DATABASE_URL` 사용) |
| `BETTER_AUTH_SECRET` | 세션 서명 키, 32자 이상 |
| `BETTER_AUTH_URL` | 로컬 `http://localhost:3000`, 운영 `https://내-주소` |
| `APP_PIN_HASH` | 잠금 PIN 의 해시(6장에서 생성) |

`.env.local` 은 `.gitignore` 에 들어 있어 GitHub에 올라가지 않습니다. 환경변수가 빠지면 화면과 서버 로그에 **어떤 변수가 문제인지** 표시됩니다.

## 4. Neon DB 연결

두 가지 경우 중 하나를 고르세요.

### A. 이미 Neon 계정이 있는 경우 (외부 DB)

1. https://console.neon.tech → **New Project**(지역: AWS Asia Pacific Singapore 또는 Tokyo)
2. 왼쪽 **Branches → New branch** 로 `dev` 브랜치를 만듭니다. `main` = 운영, `dev` = 개발
3. 프로젝트 화면 오른쪽 위 **Connect** → Branch `dev` 선택
   - **Connection pooling 켜기** 상태의 문자열 → `DATABASE_URL`
   - **끄기** 상태의 문자열 → `DATABASE_URL_UNPOOLED`

### B. Vercel에서 새 Neon DB를 만드는 경우

10장의 방법으로 Vercel 프로젝트에 Neon을 연결한 뒤, 로컬용 값을 가져옵니다.

- Vercel 대시보드 → 프로젝트 → **Storage** → 연결된 Neon DB → **Open in Neon** → Neon 콘솔에서 A의 2~3단계처럼 `dev` 브랜치를 만들고 그 주소를 사용 (권장)
- 또는 Vercel CLI로 개발 환경 변수를 받기: `npm i -g vercel` → `vercel link` → `vercel env pull .env.local`
  (이 경우 받은 값이 어떤 DB인지 꼭 확인하세요. 운영 DB를 로컬 개발에 쓰는 것은 권장하지 않습니다.)

> 연결 문자열에는 비밀번호가 들어 있습니다. 채팅·스크린샷·이슈에 붙여넣지 마세요.

## 5. 데이터베이스 마이그레이션

마이그레이션 SQL은 스키마(`src/db/schema`)로부터 Drizzle Kit이 만듭니다. 이 저장소는 위 검증 상태 때문에 **처음 한 번 직접 생성**해야 합니다.

```powershell
npm run db:generate         # drizzle/0000_xxx.sql 생성 (처음 1회, 이후 스키마 변경 시)
Get-Content .\drizzle\*.sql # 내용 확인: CREATE TABLE 11개, 인덱스, 외래키, CHECK 제약
npm run db:migrate          # 개발 DB에 적용
npm run db:check            # 연결·테이블 점검
```

생성된 `drizzle/` 폴더는 **반드시 Git에 커밋**합니다. 빌드(`npm run build`)는 마이그레이션을 실행하지 않으므로 배포 과정에서 테이블이 자동 삭제되거나 바뀌는 일이 없습니다.

## 6. 최초 소유자 계정과 잠금 PIN 만들기

공개 회원가입은 막혀 있습니다. 소유자 계정은 아래 스크립트로만 만들 수 있습니다.

```powershell
npm run owner:create        # 이메일, 이름, 로그인 비밀번호(12자 이상) 입력
```

### 잠금 PIN (2차 잠금)

로그인한 뒤에도 PIN 을 입력해야 기록이 열립니다.

- 브라우저를 닫거나, 15분 동안 아무 조작이 없거나, 12시간이 지나면 다시 잠깁니다.
- 5번 틀리면 15분 동안 입력이 막힙니다.
- PIN 숫자는 코드·Git·DB 어디에도 저장되지 않고, 해시만 환경변수에 둡니다.

```powershell
npm run pin:hash            # 원하는 PIN(숫자 4~12자리)을 두 번 입력 → APP_PIN_HASH="..." 출력
notepad .env.local          # 출력된 한 줄을 붙여넣기
```

PIN 을 바꾸고 싶으면 같은 명령으로 새 해시를 만들어 교체하면 됩니다. 기존 잠금 해제 상태는 자동으로 무효가 됩니다.

> 개발 DB와 운영 DB가 다르면 **계정과 마이그레이션을 각 DB마다 따로** 해야 합니다 (12장). PIN 해시는 DB가 아니라 환경변수라서 로컬과 Vercel에 각각 등록합니다(같은 값을 써도 됩니다).

로그인 비밀번호를 잊었을 때: `npm run owner:reset-password` (모든 기기 로그아웃).

## 7. 로컬 실행과 로그인 테스트

```powershell
npm run dev
```

1. http://localhost:3000 → 로그인 화면으로 이동되는지 확인
2. 6장에서 만든 이메일·비밀번호로 로그인 → **잠금 화면** → PIN 입력 → 대시보드
3. 새 메모 작성 → 잠시 뒤 "저장됨" 표시 → 새로고침해도 남아 있는지 확인
4. 일기 작성(기분 선택 필수) → 캘린더에 표시되는지 확인
5. 설정 → 지금 잠그기 → 다시 PIN 을 요구하는지 확인
6. 시크릿 창에서 http://localhost:3000/notes, http://localhost:3000/api/export 를 열어 접근이 차단되는지 확인

## 8. GitHub에 업로드

1. https://github.com → 오른쪽 위 **+ → New repository**
2. 이름 `my-archive`, **Private** 선택, README/.gitignore/license 는 **추가하지 않음** → **Create repository**

```powershell
git config --global user.name "내 이름"
git config --global user.email "내 GitHub 이메일"

git init
git add .
git status                       # .env.local 이 목록에 없어야 합니다
git check-ignore -v .env.local   # .gitignore 규칙이 출력되면 정상
git commit -m "feat: My Archive 첫 버전"
git branch -M main
git remote add origin https://github.com/<아이디>/my-archive.git
git push -u origin main
```

## 9. Vercel에서 저장소 연결

1. https://vercel.com → **Continue with GitHub**
2. **Add New… → Project → Import Git Repository** 에서 `my-archive` **Import**
   (목록에 없으면 **Adjust GitHub App Permissions** 로 저장소 접근 허용)
3. Framework Preset **Next.js**(자동), Root Directory `./`, Build 설정은 기본값
4. 이 화면에서는 아직 **Deploy 하지 말고**, 먼저 10~11장을 진행합니다.
   (이미 눌렀다면 첫 배포는 환경변수 부족으로 실패하거나 오류 화면이 뜹니다. 정상이며 11장 후 Redeploy 하면 됩니다.)

## 10. Vercel Marketplace에서 Neon 무료 플랜 연결

**새 DB를 만드는 경우**

1. Vercel 프로젝트 → 상단 **Storage** 탭 → **Create Database** → **Neon** 선택 → **Continue**
2. 플랜 **Free**, 지역은 가까운 곳(예: Singapore) → 이름 입력 → **Create**
3. **Connect Project** 에서 이 프로젝트를 고르고, 환경은 **Production**(필요하면 Preview, Development 도) 선택 → **Connect**
4. 프로젝트 환경변수에 `DATABASE_URL`, `DATABASE_URL_UNPOOLED` 등이 자동으로 추가됩니다. 이 앱은 이 이름을 그대로 읽습니다.

**이미 있는 Neon DB를 쓰는 경우**: Marketplace 연결 없이 11장에서 `DATABASE_URL` 을 직접 입력합니다 (Neon `main` 브랜치 주소).

### 운영 DB 마이그레이션과 계정 생성 (로컬에서 1회)

```powershell
Copy-Item .env.example .env.production.local
notepad .env.production.local     # 운영 DB 의 DATABASE_URL / DATABASE_URL_UNPOOLED 입력
npm run db:migrate:prod           # 운영 DB에 테이블 생성
npm run owner:create:prod         # 운영 DB에 소유자 계정 생성
npm run db:check:prod             # 점검
```

운영 DB 주소는 Vercel → Settings → Environment Variables 에서 `DATABASE_URL` 값을 보거나(눈 아이콘), Neon 콘솔 **Connect** 에서 `main` 브랜치로 복사합니다. `.env.production.local` 은 Git에 올라가지 않습니다.

## 11. Production 환경변수 확인

Vercel 프로젝트 → **Settings → Environment Variables** 에서 Production 에 다음이 있는지 확인하고, 없는 것은 **Add** 합니다(값만 입력, 따옴표 없이).

| Key | 값 |
| --- | --- |
| `DATABASE_URL` | Marketplace 연결 시 자동. 아니면 Neon `main` 풀러 주소 |
| `BETTER_AUTH_SECRET` | `npm run gen-secret` 새 값 (로컬과 다르게 권장) |
| `BETTER_AUTH_URL` | `https://<프로젝트>.vercel.app` 또는 연결한 도메인 |
| `APP_PIN_HASH` | `npm run pin:hash` 출력값의 따옴표 안쪽 |

`NEXT_PUBLIC_` 으로 시작하는 변수에는 비밀값을 절대 넣지 마세요(브라우저에 노출됩니다). 이 앱은 그런 변수를 쓰지 않습니다.

## 12. Production 배포

- Vercel → **Deployments** → 최신 배포의 **⋯ → Redeploy** (또는 9장에서 아직 안 눌렀다면 **Deploy**)
- **Settings → Build and Deployment → Node.js Version** 은 22.x 권장
- 도메인: 배포 상세의 **Domains** 주소. 이 주소가 `BETTER_AUTH_URL` 과 같아야 로그인됩니다.

## 13. 배포 후 저장·재접속 테스트

1. 배포 주소 접속 → 로그인 → PIN → 대시보드
2. 메모 하나, 일기 하나 작성 → "저장됨" 확인
3. 브라우저를 완전히 닫았다가 다시 접속 → PIN 을 다시 요구하는지, 기록이 그대로인지 확인
4. 휴대폰에서 같은 주소로 접속 → 같은 기록이 보이는지 확인
5. Neon 콘솔 **Tables → notes / diaries** 에서 행이 생겼는지 확인
6. 설정 → 전체 JSON 내보내기 → 한글이 깨지지 않는지 확인

## 14. 코드 수정 후 자동 재배포

```powershell
npm run verify                    # 타입 검사 + lint + 테스트 + 빌드
git add .
git commit -m "fix: 캘린더 표시 개선"
git push                          # main 에 push → Vercel 이 자동 배포
```

**스키마를 바꿀 때**(기존 데이터 보호):
1. `src/db/schema` 수정 — 새 컬럼은 NULL 허용 또는 기본값 지정
2. `npm run db:generate` → 생성된 SQL에 `DROP` 이 없는지 확인 (이름 변경은 drizzle-kit 질문에서 rename 선택)
3. `npm run db:migrate` (개발) → 테스트
4. 설정 → 전체 JSON 내보내기로 백업
5. `npm run db:migrate:prod` → `git push`

## 15. 자주 발생하는 오류

| 증상 | 원인과 해결 |
| --- | --- |
| 화면에 "환경변수 설정 오류", "APP_PIN_HASH 환경변수가 없습니다" | 해당 변수를 Vercel 에 추가 후 Redeploy. 로컬은 `.env.local` 확인 후 `npm run dev` 재시작 |
| 로그인 버튼을 눌러도 실패 / 403 | `BETTER_AUTH_URL` 이 접속 주소와 다름. 정확한 `https://` 주소로 수정 후 Redeploy |
| "이메일 또는 비밀번호가 올바르지 않습니다" | 계정을 만든 DB와 앱이 쓰는 DB가 다름(개발 DB에만 만든 경우). `npm run owner:create:prod` |
| 로그인 시도가 너무 많습니다 | 5분에 5회 제한. 기다린 뒤 다시 시도 |
| PIN 이 맞는데도 계속 잠금 화면 | 브라우저가 쿠키를 막음, 또는 http(비보안) 주소의 운영 빌드. https 로 접속 |
| `relation "notes" does not exist` | 그 DB에 마이그레이션 안 함. 개발 `db:migrate`, 운영 `db:migrate:prod` |
| `db:generate` 가 `DATABASE_URL 이 없습니다` | `.env.local` 이 `.env.local.txt` 로 저장됨. 탐색기에서 확장자 표시 후 이름 확인 |
| 데이터베이스에 연결하지 못했습니다 | Neon 무료 플랜이 잠들어 있다가 깨어나는 중(1~2초)이거나 주소 오류. 다시 시도, `npm run db:check` |
| Vercel 빌드 `Type error` | 로컬 `npm run typecheck` 로 같은 오류를 재현해 수정 후 push |
| `bufferutil` 관련 경고 | `ws` 의 선택 모듈 경고로 동작에는 영향 없음 (`serverExternalPackages` 로 번들 제외 설정됨) |
| 작성 중 저장 실패 | 내용은 이 기기 브라우저에 임시 보관됩니다. 다시 열면 "이어서 쓰기" 배너가 나타납니다 |

---

## 16. 구조와 보안 설계

### 폴더 구조

```
src/
├─ proxy.ts                 # 쿠키 기반 1차 차단(로그인 → PIN)
├─ app/
│  ├─ login/  unlock/       # 로그인, PIN 잠금 화면
│  ├─ (main)/               # 로그인+잠금 해제 후 화면(사이드바/모바일 메뉴 공통)
│  │  ├─ page.tsx           # 대시보드
│  │  ├─ notes/ (new, [id]) # 메모 목록·편집
│  │  ├─ diary/ (new, [id], calendar)
│  │  ├─ favorites/ trash/ search/ settings/
│  └─ api/
│     ├─ auth/[...all]/     # Better Auth
│     └─ export/            # JSON 전체, [kind]/[id] 개별 md/txt
├─ actions/                 # 서버 액션(메모, 일기, 휴지통, 잠금)
├─ components/              # ui / layout / notes / diary / shared / settings
├─ db/                      # 스키마(auth, app), 연결
├─ lib/                     # 인증·세션·PIN·검증·날짜·내보내기·데이터 조회(data/)
└─ types/
scripts/                    # 계정 생성, PIN 해시, DB 점검
tests/                      # Vitest
drizzle/                    # 마이그레이션 SQL (db:generate 로 생성 후 커밋)
```

### 데이터 모델

| 테이블 | 설명 |
| --- | --- |
| `user`, `session`, `account`, `verification` | Better Auth 표준 테이블 |
| `rate_limit` | 로그인 시도 제한 카운터(서버리스라 DB 저장) |
| `notes` | UUID, user_id(FK, cascade), 제목, 본문, 고정, 즐겨찾기, `deleted_at`(휴지통), 생성·수정 시각 |
| `diaries` | 위와 같고 `diary_date DATE`(일기 날짜), `mood`, `weather` 추가. 같은 날짜 여러 편 가능 |
| `tags` | 사용자별 태그, `(user_id, name)` 유일 |
| `note_tags`, `diary_tags` | 기록과 태그 연결(복합 PK, cascade) |
| `pin_attempts` | PIN 연속 실패 횟수와 잠금 시각 |

시각은 모두 `timestamptz`(UTC 저장), 화면은 Asia/Seoul 로 표시합니다. 일기 날짜는 시간대 영향이 없는 `DATE` 입니다. 사용자별 조회 인덱스, CHECK 제약(기분·날씨 값, 글자 수)이 걸려 있습니다.

### 보안

| 항목 | 구현 |
| --- | --- |
| 접근 제어 | `proxy.ts` 1차 차단 + 모든 페이지·서버 액션·조회 함수·API 가 서버에서 `requireUser()`(DB 세션 + PIN 해제) 확인 |
| 소유권 | 모든 쿼리에 `user_id = 현재 사용자` 조건. 저장은 `ON CONFLICT … WHERE user_id = 나` 로 남의 id 덮어쓰기 불가 |
| 비밀번호 | Better Auth(scrypt) 해싱, 공개 가입 비활성화, 5분 5회 시도 제한 |
| PIN 잠금 | scrypt 해시만 환경변수에 보관, HMAC 서명 쿠키(httpOnly, SameSite=Strict, 로그인 세션에 묶임, 12시간 만료), 5회 실패 시 15분 잠금, 15분 무조작 자동 잠금 |
| XSS | React 이스케이프 + 마크다운 `skipHtml`, 위험한 링크 제거, 외부 이미지 미표시 |
| CSRF | Better Auth Origin 검사, 서버 액션 Origin 검사, SameSite 쿠키 |
| SQL Injection | Drizzle 파라미터 바인딩, LIKE 와일드카드 이스케이프 |
| 캐시 노출 | 모든 화면이 요청마다 세션을 읽는 동적 렌더링, 공유 캐시 미사용, 내보내기는 `Cache-Control: private, no-store` |
| 로그 | 오류 종류와 메시지만 기록, 메모·일기 내용과 입력값은 기록하지 않음 |
| 중복 요청 | 새 기록 id 를 서버가 미리 발급 → 자동 저장 재시도에도 중복 생성 없음, 저장은 동시에 한 번만 실행 |
| 작성 중 보호 | 브라우저 임시 초안(보조 용도), 오프라인 복귀·탭 전환 시 재저장, 실패 시 15초 재시도 |
| 헤더 | HSTS, `X-Frame-Options: DENY`, `nosniff`, CSP `frame-ancestors 'none'`, 검색엔진 차단 |
