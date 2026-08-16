'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

type Question = {
  id: string;
  content: string;
  options: { id: string; content: string }[];
};

type Result = {
  totalSubmissions: number;
  distribution: { characterId: string; emoji: string; name: string; score: number; percentage: number }[];
  topCharacter: { characterId: string; emoji: string; name: string; score: number } | null;
};

export default function PlayPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken] = useState(() => crypto.randomUUID());

  useEffect(() => {
    fetch(`/api/bottari/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'questions' })
    }).then(res => res.json()).then(data => {
      setQuestions(data);
      setLoading(false);
    });
  }, [slug]);

  const handleOptionClick = async (optionId: string) => {
    const currentQ = questions[currentIndex];
    
    // Submit answer
    await fetch(`/api/bottari/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        body: { packId: slug, sessionToken, questionId: currentQ.id, optionId }
      })
    });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // All answered, fetch result
      const res = await fetch(`/api/bottari/${slug}?action=result`);
      const data = await res.json();
      setResult(data);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">불러오는 중...</div>;
  if (questions.length === 0) return <div className="flex h-screen items-center justify-center">퀴즈를 찾을 수 없습니다.</div>;

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold mb-2">결과 확인!</h1>
        <p className="text-slate-500 mb-8">{result.totalSubmissions}명의 응답이 누적되었습니다</p>

        {result.topCharacter && (
          <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md mb-8 animate-bounce-slow">
            <div className="text-6xl mb-4">{result.topCharacter.emoji}</div>
            <h2 className="text-2xl font-bold mb-2">{result.topCharacter.name}</h2>
            <p className="text-slate-600 mb-4">
              {Math.round((result.topCharacter.score / (result.totalSubmissions || 1)) * 100)}%
            </p>
            <p className="text-lg font-medium text-slate-700">
              친구들이 본 나의 모습입니다.
            </p>
          </div>
        )}

        <div className="w-full max-w-md space-y-3 mb-8">
          {result.distribution.map((item, i) => (
            <div key={item.characterId} className="flex items-center gap-3 bg-white p-4 rounded-xl">
              <span className="text-2xl w-8">{item.emoji}</span>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-700">{item.name}</div>
                <div className="text-xs text-slate-400">{item.percentage}%</div>
              </div>
              {i === 0 && <span className="text-xs font-bold text-amber-500">대표 결과</span>}
            </div>
          ))}
        </div>

        <div className="w-full max-w-md space-y-3">
          <button 
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition"
          >
            결과 공유하기
          </button>
          <button 
            onClick={() => router.push('/create')}
            className="w-full bg-white border border-slate-200 text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-50 transition"
          >
            나도 만들어보기
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const progress = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="h-2 bg-slate-200 w-full">
        <div className="h-2 bg-slate-900 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <div className="text-slate-400 text-sm mb-2">{currentIndex + 1} / {questions.length}</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center whitespace-pre-wrap">{q.content}</h2>

        <div className="w-full space-y-4">
          {q.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl p-5 text-left font-semibold text-lg text-slate-700 hover:border-slate-900 hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              {opt.content}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
