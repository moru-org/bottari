import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured') === 'true';
  const category = searchParams.get('category');

  let where: Record<string, any> = {};
  if (featured) where.isFeatured = true;
  if (category && category !== 'all') where.category = category;

  const templates = await db.packTemplate.findMany({
    where,
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ success: true, templates });
}
