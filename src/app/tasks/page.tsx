'use client';
import { useState } from 'react';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, Lock, RefreshCw, Download, Palette, Shirt, PenLine, Lightbulb } from 'lucide-react';
import MarkdownText from '@/components/MarkdownText';
import Link from 'next/link';

const generatorTypes = [
  {
    id: 'image',
    Icon: Palette,
    labelRu: 'Генерация изображений',
    labelKz: 'Суреттерді генерациялау',
    descRu: 'Создай уникальное изображение для волонтёрского проекта',
    descKz: 'Волонтерлік жобаңыз үшін бірегей сурет жасаңыз',
    placeholderRu: '"Экологическая акция в парке, яркие цвета, молодёжь сажает деревья"',
    placeholderKz: '"Parkтегі экологиялық акция, жарқын түстер, жастар ағаш отырғызуда"',
    color: '#00BFA6',
    bg: '#E0FAF7',
  },
  {
    id: 'merch',
    Icon: Shirt,
    labelRu: 'Создание мерча',
    labelKz: 'Мерч жасау',
    descRu: 'Дизайн футболок и жилеток для команды',
    descKz: 'Команда үшін футболкалар мен жилеткалар дизайны',
    placeholderRu: '"Футболка для экологического отряда «Зелёный Ертіс», зелёный фон, логотип с деревом"',
    placeholderKz: '"«Жасыл Ертіс» экологиялық отрядына арналған футболка, жасыл фон, ағаш логотипі"',
    color: '#FF7A00',
    bg: '#FFF3E0',
  },
  {
    id: 'logo',
    Icon: Sparkles,
    labelRu: 'Генерация логотипов',
    labelKz: 'Логотиптерді генерациялау',
    descRu: 'Профессиональный логотип для волонтёрской организации',
    descKz: 'Волонтерлік ұйымға арналған кәсіби логотип',
    placeholderRu: '"Логотип для зооволонтёрского отряда «Досым», лапа животного, синий цвет"',
    placeholderKz: '"«Досым» зооволонтерлік отрядына арналған логотип, жануар табаны, көк түс"',
    color: '#8b5cf6',
    bg: '#ede9fe',
  },
  {
    id: 'scenario',
    Icon: PenLine,
    labelRu: 'Написание сценариев',
    labelKz: 'Сценарийлер жазу',
    descRu: 'Готовый сценарий для мероприятия или акции',
    descKz: 'Іс-шара немесе акцияға арналған дайын сценарий',
    placeholderRu: '"Сценарий для экологической акции по уборке парка, 2 часа, 50 участников"',
    placeholderKz: '"Parkты тазалау бойынша экологиялық акцияға арналған сценарий, 2 сағат, 50 қатысушы"',
    color: '#06b6d4',
    bg: '#cffafe',
  },
];



export default function TasksPage() {
  const { t } = useLang();
  const { user, updateUser } = useAuth();
  const [activeType, setActiveType] = useState('image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"image" | "text" | null>(null);

  const activeGen = generatorTypes.find(g => g.id === activeType)!;

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResultType(null);
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeType, prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка генерации');
      }

      setResult(data.result);
      setResultType(data.type);

      if (user) {
        const historyText = data.type === 'image' 
          ? `[IMAGE] ${activeGen.labelRu}: ${prompt}` 
          : `[TEXT] ${activeGen.labelRu}: ${prompt}`;
        const history = [...(user.generationHistory || []), historyText];
        await updateUser({ generationHistory: history });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = async () => {
    if (!result) return;
    try {
      if (resultType === 'image') {
        const response = await fetch(result);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileNames: Record<string, string> = {
          image: 'generated_image',
          merch: 'generated_merch',
          logo: 'generated_logo',
        };
        link.download = `${fileNames[activeType] || 'generated_image'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated_scenario.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Download error:', e);
      alert(t('Ошибка скачивания файла', 'Файлды жүктеу қатесі'));
    }
  };

  const currentPlaceholder = t(activeGen.placeholderRu, activeGen.placeholderKz);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-orange-gradient text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={28} className="text-yellow-300" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {t('Генератор контента', 'Контент генераторы')}
            </h1>
          </div>
          <p className="text-white/85 max-w-xl">
            {t(
              'Создавай логотипы, дизайн мерча, изображения и сценарии мероприятий с помощью AI',
              'AI көмегімен логотиптер, мерч дизайны, суреттер және іс-шара сценарийлерін жасаңыз'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <Lock size={18} />
            </div>
            <div>
              <p className="font-bold text-amber-800">
                {t('Войдите для использования генератора', 'Генераторды пайдалану үшін кіріңіз')}
              </p>
              <p className="text-amber-600 text-sm">
                {t('После регистрации и анкетирования вам откроется доступ', 'Тіркеліп, анкетадан өткеннен кейін қол жеткізе аласыз')}
              </p>
            </div>
            <Link href="/auth" className="ml-auto btn-primary text-sm whitespace-nowrap">
              {t('Войти', 'Кіру')}
            </Link>
          </div>
        )}

        {/* Type selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {generatorTypes.map(g => (
            <button
              key={g.id}
              onClick={() => { setActiveType(g.id); setResult(null); setResultType(null); setPrompt(''); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                activeType === g.id
                  ? 'border-current shadow-lg scale-105'
                  : 'border-transparent bg-white hover:border-gray-200 shadow-sm'
              }`}
              style={activeType === g.id ? { borderColor: g.color, background: g.bg } : {}}
            >
              <g.Icon size={26} className="mb-2" style={{ color: g.color }} />
              <div className="font-bold text-sm" style={activeType === g.id ? { color: g.color } : { color: '#374151' }}>
                {t(g.labelRu, g.labelKz)}
              </div>
            </button>
          ))}
        </div>

        {/* Generator area */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <activeGen.Icon size={34} style={{ color: activeGen.color }} />
            <div>
              <h2 className="font-display font-bold text-xl" style={{ color: activeGen.color }}>
                {t(activeGen.labelRu, activeGen.labelKz)}
              </h2>
              <p className="text-gray-500 text-sm">{t(activeGen.descRu, activeGen.descKz)}</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('Опишите, что хотите создать:', 'Не жасағыңыз келетінін сипаттаңыз:')}
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={currentPlaceholder}
              rows={4}
              disabled={!user}
              className="w-full border-2 border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-teal-400 transition-colors resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={generate}
              disabled={!user || !prompt.trim() || loading}
              className="flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{ background: loading ? '#9ca3af' : `linear-gradient(135deg, ${activeGen.color}, ${activeGen.color}dd)` }}
            >
              {loading ? (
                <><RefreshCw size={18} className="animate-spin" /> {t('Генерирую...', 'Генерациялануда...')}</>
              ) : (
                <><Sparkles size={18} /> {t('Сгенерировать', 'Генерациялау')}</>
              )}
            </button>
            {result && (
              <button
                onClick={() => { setResult(null); setResultType(null); setPrompt(''); }}
                className="px-4 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold hover:border-gray-300 transition-colors"
              >
                {t('Очистить', 'Тазарту')}
              </button>
            )}
          </div>

          {/* Result */}
          {loading && (
            <div className="mt-6 p-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-3 text-gray-400"
              style={{ borderColor: activeGen.color + '44', background: activeGen.bg }}>
              <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: activeGen.color + '44', borderTopColor: activeGen.color }} />
              <p className="font-semibold text-sm" style={{ color: activeGen.color }}>
                {t('AI создаёт ваш контент...', 'AI контентіңізді жасауда...')}
              </p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-6 rounded-2xl border-2" style={{ borderColor: activeGen.color + '44', background: activeGen.bg }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-green-600">{t('Готово!', 'Дайын!')}</span>
              </div>
              
              {resultType === 'image' ? (
                <div className="my-4 rounded-xl overflow-hidden border border-gray-200">
                  <img src={result} alt={prompt} className="w-full h-auto object-contain max-h-[500px]" />
                </div>
              ) : (
                <div className="mb-4 rounded-xl bg-white/70 p-4">
                  <MarkdownText text={result} />
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={downloadResult}
                  className="text-xs font-bold px-4 py-2 rounded-full text-white transition-all active:scale-95 flex items-center gap-1"
                  style={{ background: activeGen.color }}
                >
                  <Download size={14} />
                  {t('Скачать', 'Жүктеу')} ↓
                </button>
                <button onClick={generate} className="text-xs font-bold px-4 py-2 rounded-full border-2 transition-all hover:opacity-80"
                  style={{ borderColor: activeGen.color, color: activeGen.color }}>
                  {t('Ещё вариант', 'Тағы нұсқа')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Prompt examples */}
        <div className="mt-8">
          <h3 className="font-bold text-gray-700 mb-4">{t('Примеры запросов:', 'Сұраным мысалдары:')}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { ru: 'Создай логотип для экологического отряда', kz: 'Экологиялық отрядқа логотип жасаңыз' },
              { ru: 'Постер для акции помощи животным', kz: 'Жануарларға көмек акциясына постер' },
              { ru: 'Сценарий субботника на 3 часа', kz: '3 сағаттық сенбілік сценарийі' },
              { ru: 'Футболка для волонтёров Красного Полумесяца', kz: 'Қызыл жарты ай волонтерлеріне футболка' },
            ].map((ex, i) => (
              <button
                key={i}
                onClick={() => user && setPrompt(t(ex.ru, ex.kz))}
                disabled={!user}
                className="text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-300 text-sm text-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
              >
                <Lightbulb size={15} className="mr-2 inline-block text-amber-500" />{t(ex.ru, ex.kz)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
