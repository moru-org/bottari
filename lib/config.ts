/**
 * 보따리 환경 설정 및 공용 게이트웨이 링크 헬퍼
 */

export const config = {
  // Moru 공용 링크 게이트웨이 주소 (프로젝트 코드: b)
  GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL || "https://moru.my",
  // 보따리 자체 서비스 주소
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://bottari.moru.my",
};

/**
 * Moru 단축 게이트웨이 규격에 맞춘 공유 링크 생성
 * Format: https://moru.my/p/b/{slug}
 */
export function getShareUrl(slug: string): string {
  // 로컬 개발 환경에서 localhost:3005 등으로 직접 접근 시에도 일관된 게이트웨이 URL 생성
  return `${config.GATEWAY_URL}/p/b/${slug}`;
}
