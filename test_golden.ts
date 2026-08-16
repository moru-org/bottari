import { db } from './lib/db';

async function main() {
  const pack = await db.pack.findFirst({ where: { slug: '테스트-친구가-보는-나는' } });
  if (!pack) {
    console.log('Pack not found');
    return;
  }

  console.log('Populating Pack:', pack.id, pack.slug);

  // Create 2 characters
  const char1 = await db.packResultCharacter.create({
    data: { packId: pack.id, name: '👑 은근한 대장', emoji: '👑', order: 0 }
  });
  const char2 = await db.packResultCharacter.create({
    data: { packId: pack.id, name: '🛋 인간 소파', emoji: '🛋', order: 1 }
  });

  // Create 1 question with 2 options
  const q1 = await db.packQuestion.create({
    data: {
      packId: pack.id,
      content: '갑자기 여행 가자고 하면 나는?',
      type: 'single_choice',
      options: {
        create: [
          { content: '바로 짐 싼다', order: 0, scores: { create: [{ characterId: char1.id, score: 2 }, { characterId: char2.id, score: 1 }] } },
          { content: '안 읽은 척한다', order: 1, scores: { create: [{ characterId: char1.id, score: 1 }, { characterId: char2.id, score: 2 }] } },
        ]
      }
    },
    include: { options: true }
  });

  console.log('Question created:', q1.id);

  // Submit 3 answers from different sessions
  const sessions = ['sess_A', 'sess_B', 'sess_C'];
  for (let i = 0; i < 3; i++) {
    const sess = sessions[i];
    const opt = i === 0 ? q1.options[0].id : q1.options[1].id;
    await db.submission.create({
      data: {
        packId: pack.id,
        sessionToken: sess,
        answers: { create: { questionId: q1.id, optionId: opt } }
      }
    });
  }

  console.log('Submissions created');
  
  // Fetch result
  const result = await db.pack.findUnique({
    where: { id: pack.id },
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

  const scores: Record<string, number> = {};
  result!.characters.forEach(c => scores[c.id] = 0);
  for (const sub of result!.submissions) {
    for (const ans of sub.answers) {
      if (ans.option && ans.option.scores) {
        for (const s of ans.option.scores) {
          scores[s.characterId] = (scores[s.characterId] || 0) + s.score;
        }
      }
    }
  }

  console.log('Aggregated Scores:', scores);
  const top = result!.characters.reduce((a, b) => (scores[a.id] > scores[b.id] ? a : b));
  console.log('Top Character:', top.name, 'with score', scores[top.id]);
}

main().finally(() => process.exit(0));
