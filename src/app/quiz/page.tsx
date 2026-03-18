'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { quizQuestions } from '@/data';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

type ScoreMap = Record<string, number>;

export default function QuizPage() {
  const { t } = useLang();
  const { updateUser } = useAuth();
  const { directions } = useData();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[][]>(Array(quizQuestions.length).fill([]));
  const [result, setResult] = useState<null | { scores: ScoreMap; top: string }>(null);

  const q = quizQuestions[step];

  const toggle = (idx: number) => {
    setAnswers(prev => {
      const cur = prev[step];
      if (q.multi) {
        return prev.map((a, i) => i === step ? (cur.includes(idx) ? cur.filter(x => x !== idx) : [...cur, idx]) : a);
      } else {
        return prev.map((a, i) => i === step ? [idx] : a);
      }
    });
  };

  const next = async () => {
    if (step < quizQuestions.length - 1) {
      setStep(s => s + 1);
    } else {
      // Calculate scores
      const scores: ScoreMap = { eco: 0, social: 0, animal: 0, event: 0, edu: 0, crisis: 0 };
      quizQuestions.forEach((q, qi) => {
        answers[qi].forEach(idx => {
          const opt = q.options[idx];
          Object.entries(opt.scores).forEach(([k, v]) => {
            scores[k] = (scores[k] || 0) + v;
          });
        });
      });
      const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
      await updateUser({ direction: top, scores });
      setResult({ scores, top });
    }
  };

  const total = Object.values(result?.scores || {}).reduce((a, b) => a + b, 0) || 1;

  if (result) {
    const topDir = directions.find(d => d.id === result.top)!;
    const sorted = Object.entries(result.scores).sort((a, b) => b[1] - a[1]);

    const descMap: Record<string, { ru: string; kz: string }> = {
      eco: {
        ru: 'Ты любишь природу и активную деятельность. Тебе подойдут акции по уборке, посадке деревьев и защите окружающей среды.',
        kz: 'Сен табиғатты және белсенді іс-әрекетті ұнатасың. Тазалау, ағаш отырғызу және қоршаған ортаны қорғау акциялары сәйкес келеді.',
      },
      social: {
        ru: 'Ты готов помогать людям в трудной ситуации. Социальное волонтёрство — твой путь!',
        kz: 'Сен қиын жағдайдағы адамдарға көмектесуге дайынсың. Әлеуметтік волонтерлік — сенің жолың!',
      },
      animal: {
        ru: 'Ты обожаешь животных и хочешь им помочь. Зооволонтёрство создано для тебя!',
        kz: 'Сен жануарларды жақсы көресің және оларға көмектескің келеді. Зооволонтерлік сен үшін жасалған!',
      },
      event: {
        ru: 'Ты организатор по натуре. Событийное волонтёрство даст тебе возможность реализоваться!',
        kz: 'Сен табиғатынан ұйымдастырушысың. Іс-шаралық волонтерлік өзіңді іске асыруға мүмкіндік береді!',
      },
      edu: {
        ru: 'Ты любишь делиться знаниями. Образовательное волонтёрство — это твоё призвание!',
        kz: 'Сен білімді бөліскенді ұнатасың. Білім беру волонтерлігі — бұл сенің мамандығың!',
      },
      crisis: {
        ru: 'Ты готов помогать людям в самых сложных ситуациях. Красный Полумесяц ждёт тебя!',
        kz: 'Сен адамдарға ең қиын жағдайларда көмектесуге дайынсың. Қызыл жарты ай сені күтеді!',
      },
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            {topDir.image ? (
              <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden bg-white shadow-sm mb-4">
                <img src={topDir.image} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="text-6xl mb-4">{topDir.icon}</div>
            )}
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-600 font-bold px-4 py-2 rounded-full mb-4">
              <CheckCircle size={18} /> {t('Результат готов!', 'Нәтиже дайын!')}
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">
              {t('Тебе подходит:', 'Саған сәйкес:')}
            </h1>
            <h2 className="font-display text-2xl font-bold" style={{ color: topDir.color }}>
              {t(topDir.labelRu + ' волонтёрство', topDir.labelKz + ' волонтерлік')}
            </h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              {t(descMap[result.top]?.ru || '', descMap[result.top]?.kz || '')}
            </p>
          </div>

          {/* Score bars */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-bold mb-4">{t('Совпадение по направлениям:', 'Бағыттар бойынша сәйкестік:')}</h3>
            <div className="space-y-3">
              {sorted.map(([key, val]) => {
                const dir = directions.find(d => d.id === key)!;
                const pct = Math.round((val / total) * 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    {dir.image ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white shadow-sm">
                        <img src={dir.image} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-xl">{dir.icon}</span>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between text-sm font-semibold mb-1">
                        <span>{t(dir.labelRu, dir.labelKz)}</span>
                        <span style={{ color: dir.color }}>{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: dir.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/organizations" className="flex-1 btn-primary text-center py-4">
              {t('Посмотреть организации', 'Ұйымдарды қарау')}
            </Link>
            <Link href="/tasks" className="flex-1 py-4 text-center font-bold border-2 border-teal-500 text-teal-600 rounded-full hover:bg-teal-50 transition-colors">
              {t('Открыть генератор', 'Генераторды ашу')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>{t('Вопрос', 'Сұрақ')} {step + 1} / {quizQuestions.length}</span>
            <span>{Math.round(((step) / quizQuestions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-gradient rounded-full transition-all duration-500"
              style={{ width: `${((step) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="font-display text-xl font-bold mb-2">{t(q.textRu, q.textKz)}</h2>
        {q.multi && (
          <p className="text-xs text-gray-400 mb-6">{t('Можно выбрать несколько', 'Бірнеше таңдауға болады')}</p>
        )}

        <div className="space-y-3 mb-8">
          {q.options.map((opt, i) => {
            const selected = answers[step].includes(i);
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-semibold text-sm ${
                  selected
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-teal-300 text-gray-700'
                }`}
              >
                {t(opt.labelRu, opt.labelKz)}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-500 hover:border-gray-300 transition-all flex items-center gap-1"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <button
            onClick={next}
            disabled={answers[step].length === 0}
            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step < quizQuestions.length - 1 ? t('Далее', 'Келесі') : t('Узнать результат', 'Нәтижені білу')}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
