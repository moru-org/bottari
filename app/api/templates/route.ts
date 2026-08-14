import { NextRequest, NextResponse } from "next/server";
import { getTemplates, getTemplateBySlug } from "@/lib/templates";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";

    if (slug) {
      const template = await getTemplateBySlug(slug);
      if (!template) {
        return NextResponse.json({ success: false, error: "템플릿을 찾을 수 없습니다." }, { status: 404 });
      }
      return NextResponse.json({ success: true, template });
    }

    const templates = await getTemplates(category || undefined, featured);
    return NextResponse.json({ success: true, templates });
  } catch (err) {
    console.error("Templates API Error:", err);
    return NextResponse.json({ success: false, error: "템플릿을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
