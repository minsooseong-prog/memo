"use client";

// 루트 레이아웃까지 실패했을 때 보이는 최후의 오류 화면
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20 }}>문제가 생겼습니다</h1>
          <p style={{ color: "#6c6862", fontSize: 14 }}>잠시 뒤 다시 시도해 주세요. 작성 중이던 글은 이 기기에 임시 보관되어 있습니다.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}>
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
