import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { QuizPayload } from "@/lib/types";

export const runtime = "nodejs";
export const alt = "보따리 퀴즈 미리보기";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  let title = "친구의 취향 보따리";
  let questionCount = 3;

  try {
    const bottari = await db.bottari.findUnique({
      where: { slug },
    });

    if (bottari) {
      title = bottari.title;
      try {
        const payload = JSON.parse(bottari.payload) as QuizPayload;
        if (payload.questions && payload.questions.length > 0) {
          questionCount = payload.questions.length;
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f1016",
          backgroundImage: "radial-gradient(circle at 50% 30%, #251e2b 0%, #0f1016 70%)",
          color: "#ffffff",
          padding: "48px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* 상단 뱃지 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(255, 107, 53, 0.15)",
            border: "1.5px solid rgba(255, 107, 53, 0.4)",
            borderRadius: "9999px",
            padding: "8px 24px",
            color: "#FF6B35",
            fontSize: "22px",
            fontWeight: 800,
            marginBottom: "24px",
          }}
        >
          <span>🎁 친구가 보낸 보따리</span>
        </div>

        {/* 보따리 메인 제목 */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: 900,
            textAlign: "center",
            maxWidth: "1000px",
            lineHeight: 1.25,
            marginBottom: "24px",
            color: "#ffffff",
          }}
        >
          {title}
        </div>

        {/* 서브 카피 */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "#FFA834",
            marginBottom: "40px",
          }}
        >
          {questionCount}문제 · 약 30초면 끝! 나를 얼마나 알고 있을까?
        </div>

        {/* 하단 푸터 */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#94a3b8",
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "#FF6B35",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 900,
            }}
          >
            보
          </div>
          <span>보따리 (bottari.moru.my) — 초간단 모바일 웹 놀이터</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
