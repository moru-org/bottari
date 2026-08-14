import { db } from "@/lib/db";
import { GOLDEN_PACK_TEMPLATES } from "@/data/pack-templates";
import { PackDefinition, PackTemplateDefinition, CategoryType } from "@/lib/pack-types";

let isSynced = false;

/**
 * DB에 기본 팩 템플릿이 없을 경우 시드 템플릿을 자동 동기화
 */
export async function syncPackTemplates(): Promise<void> {
  if (isSynced) return;

  try {
    const count = await db.packTemplate.count();
    if (count >= GOLDEN_PACK_TEMPLATES.length) {
      isSynced = true;
      return;
    }

    for (const tpl of GOLDEN_PACK_TEMPLATES) {
      await db.packTemplate.upsert({
        where: { slug: tpl.slug },
        update: {
          type: tpl.type,
          category: tpl.category,
          title: tpl.title,
          description: tpl.description,
          emoji: tpl.emoji,
          isFeatured: tpl.isFeatured ?? false,
          order: tpl.order ?? 0,
          payload: JSON.stringify(tpl.definition),
        },
        create: {
          slug: tpl.slug,
          type: tpl.type,
          category: tpl.category,
          title: tpl.title,
          description: tpl.description,
          emoji: tpl.emoji,
          isFeatured: tpl.isFeatured ?? false,
          order: tpl.order ?? 0,
          payload: JSON.stringify(tpl.definition),
        },
      });
    }
    isSynced = true;
  } catch (err) {
    console.error("Failed to sync pack templates:", err);
  }
}

/**
 * 카테고리별 또는 추천 템플릿 목록 조회
 */
export async function getTemplates(category?: string, featuredOnly?: boolean) {
  await syncPackTemplates();

  const where: any = {};
  if (category && category !== "all") {
    where.category = category;
  }
  if (featuredOnly) {
    where.isFeatured = true;
  }

  const templates = await db.packTemplate.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return templates.map((t) => {
    let definition: PackDefinition;
    try {
      definition = JSON.parse(t.payload);
    } catch {
      definition = {
        version: 1,
        type: t.type as any,
        title: t.title,
        description: t.description || undefined,
        emoji: t.emoji,
        config: { type: t.type as any, questions: [] } as any,
        submissionPolicy: { maxSubmissionsPerSession: 1, allowMultiple: false },
      };
    }

    return {
      id: t.id,
      slug: t.slug,
      type: t.type,
      category: t.category as CategoryType,
      title: t.title,
      description: t.description,
      emoji: t.emoji,
      isFeatured: t.isFeatured,
      order: t.order,
      definition,
    };
  });
}

/**
 * 단일 템플릿 조회
 */
export async function getTemplateBySlug(slug: string) {
  await syncPackTemplates();

  const template = await db.packTemplate.findUnique({
    where: { slug },
  });

  if (!template) return null;

  let definition: PackDefinition;
  try {
    definition = JSON.parse(template.payload);
  } catch {
    definition = {
      version: 1,
      type: template.type as any,
      title: template.title,
      description: template.description || undefined,
      emoji: template.emoji,
      config: { type: template.type as any, questions: [] } as any,
      submissionPolicy: { maxSubmissionsPerSession: 1, allowMultiple: false },
    };
  }

  return {
    id: template.id,
    slug: template.slug,
    type: template.type,
    category: template.category as CategoryType,
    title: template.title,
    description: template.description,
    emoji: template.emoji,
    isFeatured: template.isFeatured,
    order: template.order,
    definition,
  };
}
