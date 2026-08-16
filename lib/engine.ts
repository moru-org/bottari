import { randomUUID } from 'crypto';
import { db } from './db';

// --- Types ---
export type PackQuestion = {
  id: string;
  content: string;
  type: string;
  options: { id: string; content: string; scores: { characterId: string; score: number }[] }[];
};

export type PackResult = {
  totalSubmissions: number;
  distribution: { characterId: string; emoji: string; name: string; score: number; percentage: number }[];
  topCharacter: { characterId: string; emoji: string; name: string; score: number } | null;
};

export type CreatePackPayload = {
  title: string;
  description?: string;
  type?: string;
  templateId?: string;
  ownerId?: string;
  ownerToken?: string;
};

// --- Helpers ---
function generateSlug(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);
  return base || 'bottari';
}

function hashToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

// --- Core Engine ---

export async function createPack(data: CreatePackPayload): Promise<string> {
  const slug = generateSlug(data.title);
  let token = data.ownerToken;
  if (!token) token = randomUUID();

  return db.$transaction(async (tx) => {
    let packPayload = null;
    if (data.templateId) {
      const template = await tx.packTemplate.findUnique({ where: { id: data.templateId } });
      if (template && template.payload) {
        packPayload = JSON.parse(template.payload);
      }
    }

    const pack = await tx.pack.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        type: data.type || packPayload?.type || 'friend_quiz',
        ownerId: data.ownerId,
        ownerTokenHash: hashToken(token),
        templateId: data.templateId,
      }
    });

    return pack.slug;
  });
}

export async function getPackQuestions(packId: string): Promise<PackQuestion[]> {
  return db.packQuestion.findMany({
    where: { packId },
    orderBy: { order: 'asc' },
    include: {
      options: {
        orderBy: { order: 'asc' },
        include: { scores: true }
      }
    }
  });
}

export async function submitAnswer(packId: string, sessionToken: string, questionId: string, optionId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    // Ensure submission exists
    let submission = await tx.submission.findFirst({ where: { packId, sessionToken } });
    if (!submission) {
      submission = await tx.submission.create({
        data: { packId, sessionToken, answers: { create: { questionId, optionId } } }
      });
    } else {
      // Update or create answer
      await tx.submissionAnswer.upsert({
        where: { submissionId_questionId: { submissionId: submission.id, questionId } },
        update: { optionId },
        create: { submissionId: submission.id, questionId, optionId }
      });
    }
  });
}

export async function getResult(packId: string): Promise<PackResult> {
  const pack = await db.pack.findUnique({
    where: { id: packId },
    include: {
      characters: { orderBy: { order: 'asc' } },
      submissions: { 
        where: { sessionToken: { not: null } },
        include: { 
          answers: { 
            include: { 
              option: { 
                include: { scores: true } 
              } 
            } 
          }
        }
      }
    }
  });

  if (!pack) throw new Error('Pack not found');

  // Aggregate scores per character
  const scores: Record<string, number> = {};
  pack.characters.forEach(c => scores[c.id] = 0);

  for (const sub of pack.submissions) {
    for (const ans of sub.answers) {
      if (ans.option && ans.option.scores) {
        for (const s of ans.option.scores) {
          scores[s.characterId] = (scores[s.characterId] || 0) + s.score;
        }
      }
    }
  }

  const total = pack.submissions.length || 1;
  const distribution = pack.characters
    .map(c => ({
      characterId: c.id,
      emoji: c.emoji,
      name: c.name,
      score: scores[c.id] || 0,
      percentage: Math.round(((scores[c.id] || 0) / total) * 100)
    }))
    .sort((a, b) => b.score - a.score);

  const topCharacter = distribution.length > 0 ? distribution[0] : null;

  return {
    totalSubmissions: pack.submissions.length,
    distribution,
    topCharacter
  };
}

export async function deletePack(packId: string, ownerToken: string): Promise<void> {
  const hash = hashToken(ownerToken);
  const pack = await db.pack.findUnique({ where: { id: packId } });
  if (!pack || (pack.ownerTokenHash !== hash && pack.ownerId !== null)) {
    throw new Error('Unauthorized');
  }
  await db.pack.delete({ where: { id: packId } });
}
