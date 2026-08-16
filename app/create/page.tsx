'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('friend_quiz');
  const [packSlug, setPackSlug] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [questions, setQuestions] = useState<{ content: string; options: string[] }[]>([
    { content: 'Q1. 질문을 입력하세요', options: ['선택지 A', '선택지 B', '선택지 C', '선택지 D'] }
  ]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bottari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create', 
          body: { title, type, ownerToken: 'anon-' + Math.random().toString(36).slice(2) }
        })
      });
      const data = await res.json();
      if (data.slug) {
        setPackSlug(data.slug);
        setStep(2);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePack = async () => {
    // For V1, we just redirect to the play page or a management page
    // In a full implementation, we'd POST the questions to an API endpoint
    router.push(`/p/${packSlug}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8 mt-8">내 보따리 만들기</h1>

      {step === 1 && (
        <div className="w-full max-w-md space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">제목</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 친구들이 보는 나는?" 
              className="w-full border border-slate-300 rounded-xl p-4 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">유형</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-4 text-lg bg-white"
            >
              <option value="friend_quiz">친구가 보는 나는?</option>
              <option value="guess_me">나의 연애 스타일은?</option>
              <option value="first_impression">첫인상 vs 현재</option>
              <option value="anonymous_feedback">익명 피드백</option>
              <option value="balance">2지선다 게임</option>
            </select>
          </div>

          <button 
            onClick={handleCreate}
            disabled={loading || !title}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {loading ? '생성 중...' : '기본 생성하기'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-md space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className="bg-white p-4 rounded-xl border border-slate-200">
              <input 
                value={q.content} 
                onChange={e => {
                  const newQ = [...questions];
                  newQ[qi].content = e.target.value;
                  setQuestions(newQ);
                }}
                className="w-full font-bold text-lg mb-2 p-2"
              />
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <input 
                    key={oi}
                    value={opt}
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[qi].options[oi] = e.target.value;
                      setQuestions(newQ);
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                  />
                ))}
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setQuestions([...questions, { content: `Q${questions.length + 1} 질문`, options: ['A', 'B', 'C', 'D'] }])}
            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold"
          >
            + 질문 추가
          </button>

          <button 
            onClick={handleSavePack}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4"
          >
            완성하고 공유하기
          </button>
        </div>
      )}
    </div>
  );
}
