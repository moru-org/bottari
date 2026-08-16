import { PrismaClient } from '@prisma/client';
import { GOLDEN_PACK_TEMPLATES } from '../data/pack-templates';

const prisma = new PrismaClient();

function generateSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);
}

async function main() {
  console.log('Seeding V1 Templates...');
  
  for (const tpl of GOLDEN_PACK_TEMPLATES) {
    const payload = tpl.definition?.config || {};
    
    await prisma.packTemplate.upsert({
      where: { slug: tpl.slug },
      update: {},
      create: {
        slug: tpl.slug,
        type: tpl.type,
        category: tpl.category,
        title: tpl.title,
        description: tpl.description,
        emoji: tpl.emoji,
        isFeatured: tpl.isFeatured || false,
        order: tpl.order,
        payload: JSON.stringify(payload)
      }
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
