import { config, getShareUrl } from "./config";

interface RegisterLinkParams {
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  renderMode?: "REDIRECT" | "LANDING";
}

/**
 * Moru 게이트웨이에 단축 링크 등록 (비동기 연동)
 */
export async function registerMoruLink({
  slug,
  title,
  description,
  imageUrl,
  renderMode = "REDIRECT",
}: RegisterLinkParams): Promise<string | null> {
  const moruApiUrl = process.env.MORU_API_URL || "http://host.docker.internal:3001";
  const moruApiKey =
    process.env.MORU_API_KEY ||
    process.env.ADMIN_API_KEY ||
    "moru_adm_master_secret_2026_super_key";

  const targetUrl = `${config.APP_URL}/p/${slug}`;

  try {
    const res = await fetch(`${moruApiUrl}/api/v1/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${moruApiKey}`,
      },
      body: JSON.stringify({
        project: "b",
        slug,
        target_url: targetUrl,
        render_mode: renderMode,
        title: `🎁 ${title} — 나를 얼마나 알아?`,
        description:
          description ||
          "친구가 보낸 취향 퀴즈 보따리! 30초 만에 맞히고 결과를 확인해보세요.",
        image_url:
          imageUrl ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80",
        is_indexable: false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.public_url || getShareUrl(slug);
    }
  } catch (err) {
    console.warn("[Moru Gateway] Link auto-registration skipped (fallback active):", err);
  }

  return getShareUrl(slug);
}
