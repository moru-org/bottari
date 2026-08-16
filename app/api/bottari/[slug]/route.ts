import { NextRequest, NextResponse } from 'next/server';
import { submitAnswer, getPackQuestions, getResult, createPack } from '@/lib/engine';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { action, body } = await request.json();

  if (action === 'create') {
    try {
      const createdSlug = await createPack(body);
      return NextResponse.json({ success: true, slug: createdSlug });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  if (action === 'submit') {
    const { packId, sessionToken, questionId, optionId } = body;
    if (!packId || !questionId || !optionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    await submitAnswer(packId, sessionToken, questionId, optionId);
    return NextResponse.json({ success: true });
  }

  if (action === 'questions') {
    const questions = await getPackQuestions(slug);
    return NextResponse.json(questions);
  }

  if (action === 'result') {
    const result = await getResult(slug);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'result') {
    const result = await getResult(slug);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
