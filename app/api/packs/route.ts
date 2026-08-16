import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const packs = await db.pack.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      _count: { select: { submissions: true } }
    }
  });
  return NextResponse.json({ packs });
}
