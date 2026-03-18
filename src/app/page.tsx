'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/LangContext';
import { useData } from '@/lib/DataContext';
import { Sparkles, Grid, Users, Shield, Plus, Heart, MonitorCheck, TreePine, Dog } from 'lucide-react';
import AIGuide from '@/components/AIGuide';

interface EventData {
  id: number;
  titleRu: string;
  titleKz: string;
  descRu: string;
  descKz: string;
  date: string;
  location: string;
  direction: string;
  color: string;
  emoji: string;
  image?: string;
}

export default function HomePage() {
  const { t } = useLang();
  const { directions } = useData();
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.events?.slice(0, 2) || [])) // Only take 2 for the UI
      .catch(() => {});
  }, []);

  const steps = [
    { num: 1, ru: 'Зарегистрируйся', kz: 'Тіркел' },
    { num: 2, ru: 'Пройди анкетирование', kz: 'Анкеталау өт' },
    { num: 3, ru: 'Получи своё направление', kz: 'Бағытыңды ал' },
    { num: 4, ru: 'Выбери организацию', kz: 'Ұйым таңда' },
    { num: 5, ru: 'Начни помогать', kz: 'Көмектесе бастаңыз' },
  ];

  const whatYouCanDo = [
    { icon: <Heart size={32} className="text-orange-500" />, titleRu: 'Создавать дизайн и логотипы', titleKz: 'Дизайн және логотиптер жасау' },
    { icon: <MonitorCheck size={32} className="text-blue-500" />, titleRu: 'Помогать с соцсетями', titleKz: 'Әлеуметтік желілерге көмектесу' },
    { icon: <Users size={32} className="text-red-400" />, titleRu: 'Участвовать в эко-проектах', titleKz: 'Эко-жобаларға қатысу' },
    { icon: <TreePine size={32} className="text-green-600" />, titleRu: 'Не оставлять в беде', titleKz: 'Мұқтажды тастамау' },
    { icon: <Dog size={32} className="text-amber-700" />, titleRu: 'Зоо волонтёрство', titleKz: 'Зооволонтерлік' },
  ];

  // Hardcoded direction styles to match the mockup perfectly
  const directionStyles: Record<string, { bg: string; text: string; btnBg: string; btnText: string }> = {
    'social': { bg: 'bg-[#d1f0f4]', text: 'text-teal-900', btnBg: 'bg-white', btnText: 'text-teal-900' },
    'eco': { bg: 'bg-[#218c74]', text: 'text-white', btnBg: 'bg-white', btnText: 'text-[#218c74]' },
    'animals': { bg: 'bg-[#f39c12]', text: 'text-white', btnBg: 'bg-white', btnText: 'text-[#f39c12]' },
    'emergencies': { bg: 'bg-[#e74c3c]', text: 'text-white', btnBg: 'bg-white', btnText: 'text-[#e74c3c]' },
    'red-crescent': { bg: 'bg-white border border-gray-200', text: 'text-red-600', btnBg: 'bg-white border shadow-sm', btnText: 'text-gray-700' },
  };

  return (
    <div className="min-h-screen font-sans">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-40 md:pb-[18rem] text-white bg-[#1a7f84]">
        {/* High Resolution Background Image with seamless physical masking */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2560"
            alt="Volunteers Background"
            className="absolute right-0 top-0 w-full h-full object-cover object-[center_top] opacity-60 mix-blend-luminosity"
            style={{ 
              maskImage: 'linear-gradient(to right, transparent 0%, transparent 35%, black 75%, black 100%)', 
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 35%, black 75%, black 100%)' 
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-20">
          <div className="max-w-lg">
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <span className="font-display font-light text-5xl tracking-wide">IT</span>
                <span className="font-display font-bold text-5xl tracking-wide">ERTIS</span>
                <Sparkles className="text-yellow-400 fill-yellow-400 drop-shadow-md -mt-3" size={32} />
              </div>
              <div className="font-display font-extrabold text-4xl tracking-widest pl-[3.5rem] mt-1 shadow-black/10 text-shadow-sm">VOLUNTEER</div>
            </div>

            <h1 className="text-4xl md:text-[44px] font-extrabold leading-tight mb-8 drop-shadow-md">
              {t('Технологии, которые', 'Жаңа технологиялар')} <br />
              {t('помогают', 'көмектесетін')} <br />
              {t('менять мир', 'әлемді өзгертуге')}
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/auth" className="bg-[#ff8a00] hover:bg-[#ff9d2e] text-white px-8 py-3.5 rounded-full font-bold text-center transition-all shadow-[0_4px_14px_0_rgba(255,138,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,138,0,0.23)] hover:-translate-y-0.5">
                {t('Стать волонтёром', 'Волонтер болу')}
              </Link>
              <Link href="/directions" className="border-2 border-white/90 hover:bg-white hover:text-[#1e858a] text-white px-8 py-3.5 rounded-full font-bold text-center transition-all">
                {t('Узнать больше', 'Көбірек білу')}
              </Link>
            </div>
          </div>
        </div>

        {/* The Wave Separator */}
        <div className="absolute left-0 right-0 bottom-[-1px] pointer-events-none w-full leading-none z-20">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-[80px] md:h-[180px]" fill="#f8fafc">
            <path d="M0,160 C400,320 900,0 1440,120 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </section>

      {/* Что такое IT-волонтёр? */}
      <section className="bg-slate-50 py-16 px-4 relative overflow-hidden z-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#e0f1f4] rounded-lg flex items-center justify-center text-[#249fa6]">
                <Grid size={24} />
              </div>
              <h2 className="text-3xl font-display font-bold text-slate-800">
                {t('Что такое IT-волонтёр?', 'IT-волонтер дегеніміз не?')}
              </h2>
            </div>
            
            <p className="text-slate-700 leading-relaxed mb-4 text-lg">
              <strong>{t('IT-волонтёр', 'IT-волонтер')}</strong> — {t('это платформа, где встречаются IT-специалисты и гражданские активисты.', 'бұл IT-мамандар мен азаматтық белсенділер кездесетін платформа.')}
            </p>
            
            <div className="flex gap-3 items-start mt-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="mt-1 flex-shrink-0">
                <Sparkles className="text-orange-400 fill-orange-400" size={20} />
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                {t('Платформа объединяет технологии и волонтёрство, чтобы делать помощь быстрее, эффективнее и доступнее.', 'Платформа технологиялар мен волонтерлікті біріктіреді, сондықтан көмек жылдамырақ, тиімдірек және қолжетімдірек болады.')}
              </p>
            </div>
          </div>

          <div className="relative">
            {/* Artistic Paint Splatter Backdrops */}
            <div className="absolute top-[20%] left-[-10%] w-[80%] h-[80%] bg-blue-200/50 rounded-full blur-3xl z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-green-200/50 rounded-full blur-3xl z-0" />
            
            {/* Simulating the cutout person with laptop */}
            <div className="relative z-10 rounded-[2.5rem] shadow-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-500">
              <img 
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800" 
                alt="Volunteer" 
                className="w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Что ты можешь делать? */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-[#2b5a74] mb-12">
            {t('Что ты можешь делать?', 'Сен не істей аласың?')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {whatYouCanDo.map((item, i) => (
              <div key={i} className="bg-[#f0f6f8] rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="h-24 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-[#2b5a74] text-sm mb-6 min-h-[40px] flex items-center justify-center">
                  {t(item.titleRu, item.titleKz)}
                </h3>
                <Link href="/directions" className="bg-[#ff8a00] text-white font-bold text-xs py-2.5 px-6 rounded-full hover:bg-[#e67c00] transition-colors w-full">
                  {t('Подробнее', 'Толығырақ')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Направления волонтёрства */}
      <section className="bg-slate-50 py-20 px-4 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-[#2b5a74] mb-12">
            {t('Направления волонтёрства', 'Волонтерлік бағыттары')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {directions.length > 0 ? (
              directions.slice(0, 5).map((d) => {
                const style = directionStyles[d.id] || { bg: 'bg-[#ff8a00]', text: 'text-white', btnBg: 'bg-white', btnText: 'text-[#ff8a00]' };
                return (
                  <div key={d.id} className={`${style.bg} ${style.text} rounded-3xl p-6 flex flex-col items-center text-center shadow-md transform hover:-translate-y-1 transition-transform`}>
                    <div className="text-4xl mb-3 opacity-90">{d.icon}</div>
                    <h3 className="font-bold text-sm mb-6 pt-2">{t(d.labelRu, d.labelKz)}</h3>
                    <Link href={`/directions#${d.id}`} className={`${style.btnBg} ${style.btnText} font-bold text-xs py-2.5 px-6 rounded-full transition-colors w-full mt-auto`}>
                      {t('Подробнее', 'Толығырақ')}
                    </Link>
                  </div>
                );
              })
            ) : (
              // Fallback cards if data is empty during initial render
              [1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="bg-gray-200 animate-pulse h-40 rounded-3xl"></div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Как это работает? */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-[#2b5a74] mb-16">
            {t('Как это работает?', 'Бұл қалай жұмыс істейді?')}
          </h2>
          
          <div className="relative">
            {/* The dashed connecting line */}
            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0 border-t-2 border-dashed border-slate-300 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {steps.map((s, i) => (
                <div key={s.num} className="flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-xl mb-4 shadow-lg ${i === 0 ? 'bg-[#ff8a00]' : 'bg-[#249fa6]'}`}>
                    {s.num}
                  </div>
                  <p className="font-semibold text-slate-700 text-sm max-w-[140px]">
                    {t(s.ru, s.kz)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Новости и мероприятия */}
      <section className="bg-gradient-to-b from-[#eaf4f7] to-[#8dbdc6] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-[#2b5a74] mb-12">
            {t('Новости и мероприятия', 'Жаңалықтар мен іс-шаралар')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {events.length > 0 ? events.map((e) => (
              <div key={e.id} className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-teal-900/10 flex flex-col group hover:-translate-y-1 transition-transform">
                <div className="h-56 relative overflow-hidden bg-slate-200">
                  {e.image ? (
                    <img src={e.image} alt={e.titleRu} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl" style={{ backgroundColor: e.color || '#f1f5f9' }}>{e.emoji}</div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-[#2b5a74] text-lg mb-4 line-clamp-1">{t(e.titleRu, e.titleKz)}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm text-slate-500 font-medium">{e.date}</span>
                    <Link href={`/news`} className="bg-[#ff8a00] text-white font-bold text-sm py-2 px-8 rounded-full hover:bg-[#e67c00] transition-colors shadow-md shadow-orange-500/30">
                      {t('Записаться', 'Тіркелу')}
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              // Fallback loading states
              <>
                <div className="bg-white/50 backdrop-blur rounded-3xl h-80 animate-pulse"></div>
                <div className="bg-white/50 backdrop-blur rounded-3xl h-80 animate-pulse"></div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer CTA Banner */}
      <section className="bg-[#ff8a00] py-14 px-4 text-center border-b-8 border-[#2b5a74]">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6">
          {t('Создавай. Генерируй. Вдохновляй.', 'Жасаңыз. Генерациялаңыз. Шабыттандырыңыз.')}
        </h2>
        <Link href="/tasks" className="inline-block border-2 border-white text-white font-bold py-3.5 px-10 rounded-full hover:bg-white hover:text-[#ff8a00] transition-colors shadow-lg">
          {t('Попробовать генератор', 'Генераторды сынап көру')}
        </Link>
      </section>
      
      {/* Interactive AI Guide Widget */}
      <AIGuide />
    </div>
  );
}
