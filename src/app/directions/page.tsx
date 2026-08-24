'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/LangContext';
import { useData } from '@/lib/DataContext';
import { ArrowRight } from 'lucide-react';

interface OrgData {
  id: number;
  name: string;
  direction: string;
}

const descriptions: Record<string, { ru: string; kz: string; activities: { ru: string; kz: string }[] }> = {
  eco: {
    ru: 'Экологическое волонтёрство — это забота о природе и окружающей среде. Волонтёры организуют уборки, высаживают деревья, проводят экологические акции.',
    kz: 'Экологиялық волонтерлік — табиғат пен қоршаған ортаға қамқорлық. Волонтерлер тазалау жұмыстарын ұйымдастырады, ағаш отырғызады, экологиялық акциялар өткізеді.',
    activities: [
      { ru: 'Уборка территорий', kz: 'Аумақтарды тазалау' },
      { ru: 'Посадка деревьев', kz: 'Ағаш отырғызу' },
      { ru: 'Экологические акции', kz: 'Экологиялық акциялар' },
      { ru: 'Работа с природными объектами', kz: 'Табиғи объектілермен жұмыс' },
    ],
  },
  social: {
    ru: 'Социальное волонтёрство — помощь людям, оказавшимся в трудной жизненной ситуации. Работа с пожилыми, детьми, людьми с ограниченными возможностями.',
    kz: 'Әлеуметтік волонтерлік — өмірдің қиын жағдайына тап болған адамдарға көмек. Қарттармен, балалармен, мүмкіндігі шектеулі адамдармен жұмыс.',
    activities: [
      { ru: 'Помощь пожилым', kz: 'Қарттарға көмек' },
      { ru: 'Работа с детьми', kz: 'Балалармен жұмыс' },
      { ru: 'Гуманитарная помощь', kz: 'Гуманитарлық көмек' },
      { ru: 'Психологическая поддержка', kz: 'Психологиялық қолдау' },
    ],
  },
  animal: {
    ru: 'Зооволонтёрство — помощь животным. Уход за питомцами в приютах, поиск хозяев, лечение животных.',
    kz: 'Зооволонтерлік — жануарларға көмек. Баспаналардағы үй жануарларына күтім жасау, иелер іздеу, жануарларды емдеу.',
    activities: [
      { ru: 'Уход за животными', kz: 'Жануарларға күтім жасау' },
      { ru: 'Поиск хозяев', kz: 'Иелер іздеу' },
      { ru: 'Выгул питомцев', kz: 'Үй жануарларын серуендету' },
      { ru: 'Ветеринарная помощь', kz: 'Ветеринарлық көмек' },
    ],
  },
  patriotic: {
    ru: 'Патриотическое волонтёрство — любовь к родине и активная гражданская позиция. Участие в государственных и городских инициативах.',
    kz: 'Патриоттық волонтерлік — отанға деген сүйіспеншілік және белсенді азаматтық ұстаным. Мемлекеттік және қалалық бастамаларға қатысу.',
    activities: [
      { ru: 'Участие в гос. инициативах', kz: 'Мемлекеттік бастамаларға қатысу' },
      { ru: 'Поддержка ветеранов', kz: 'Ардагерлерді қолдау' },
      { ru: 'Патриотические акции', kz: 'Патриоттық акциялар' },
      { ru: 'Сохранение истории', kz: 'Тарихты сақтау' },
    ],
  },
  crisis: {
    ru: 'ЧС волонтёрство — помощь в чрезвычайных ситуациях и ликвидация последствий аварий. Спасение и поддержка пострадавших.',
    kz: 'ТЖ волонтерлігі — төтенше жағдайларда көмек көрсету және авариялардың салдарын жою. Зардап шеккендерді құтқару және қолдау.',
    activities: [
      { ru: 'Ликвидация последствий ЧС', kz: 'ТЖ салдарын жою' },
      { ru: 'Поиск людей', kz: 'Адамдарды іздеу' },
      { ru: 'Помощь при стихийных бедствиях', kz: 'Табиғи апаттар кезіндегі көмек' },
      { ru: 'Обеспечение безопасности', kz: 'Қауіпсіздікті қамтамасыз ету' },
    ],
  },
  medical: {
    ru: 'Медицинское волонтёрство — помощь в сфере здравоохранения. Первая помощь, донорство крови, просвещение и поддержка больниц.',
    kz: 'Медициналық волонтерлік — денсаулық сақтау саласындағы көмек. Алғашқы көмек, қан донорлығы, ағарту және ауруханаларды қолдау.',
    activities: [
      { ru: 'Донорство крови', kz: 'Қан донорлығы' },
      { ru: 'Первая медицинская помощь', kz: 'Алғашқы медициналық көмек' },
      { ru: 'Поддержка медперсонала', kz: 'Медицина қызметкерлерін қолдау' },
      { ru: 'Санитарное просвещение', kz: 'Санитарлық ағарту' },
    ],
  },
  edu: {
    ru: 'Наука и просвещение — передача знаний и развитие науки. Организация лекций, мастер-классов и научных проектов.',
    kz: 'Ғылым және ағарту — білім беру және ғылымды дамыту. Лекциялар, шеберлік сабақтары және ғылыми жобаларды ұйымдастыру.',
    activities: [
      { ru: 'Организация лекций', kz: 'Лекцияларды ұйымдастыру' },
      { ru: 'Обучение молодёжи', kz: 'Жастарды оқыту' },
      { ru: 'Популяризация науки', kz: 'Ғылымды дәріптеу' },
      { ru: 'Проведение мастер-классов', kz: 'Шеберлік сабақтарын өткізу' },
    ],
  },
  event: {
    ru: 'Творческое волонтёрство — поддержка искусства и культуры. Организация концертов, выставок, фестивалей и творческих инициатив.',
    kz: 'Шығармашылық волонтерлік — өнер мен мәдениетті қолдау. Концерттер, көрмелер, фестивальдар және шығармашылық бастамаларды ұйымдастыру.',
    activities: [
      { ru: 'Организация выставок', kz: 'Көрмелерді ұйымдастыру' },
      { ru: 'Участие в концертах', kz: 'Концерттерге қатысу' },
      { ru: 'Культурные события', kz: 'Мәдени оқиғалар' },
      { ru: 'Творческие мастерские', kz: 'Шығармашылық шеберханалар' },
    ],
  },
};

export default function DirectionsPage() {
  const { t } = useLang();
  const { directions } = useData();
  const [organizations, setOrganizations] = useState<OrgData[]>([]);

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => setOrganizations(data.organizations || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-teal-gradient text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t('Направления волонтёрства', 'Волонтерлік бағыттары')}
          </h1>
          <p className="text-white/80">
            {t('Выбери направление, которое подходит именно тебе', 'Саған сай бағытты таңда')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {directions.map(d => {
          const desc = descriptions[d.id];
          const orgs = organizations.filter(o => o.direction === d.id);
          return (
            <div key={d.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-8" style={{ backgroundColor: d.bg }}>
                <div className="flex items-center gap-6 mb-8">
                  {d.image ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white">
                      <img alt="" src={d.image} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-6xl shrink-0">{d.icon}</div>
                  )}
                  <div>
                    <h2 className="font-display text-2xl font-bold" style={{ color: d.color }}>
                      {t(d.labelRu, d.labelKz)}
                    </h2>
                    <div className="text-sm font-semibold mt-1" style={{ color: d.color }}>
                      {orgs.length} {t('организаций', 'ұйым')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {desc ? (
                  <>
                    <p className="text-gray-600 leading-relaxed mb-4">{t(desc.ru, desc.kz)}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {desc.activities.map((a, i) => (
                        <span key={i} className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: d.bg, color: d.color }}>
                          {t(a.ru, a.kz)}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-600 leading-relaxed mb-4">{t(d.descRu, d.descKz) || t('Описание не указано', 'Сипаттамасы көрсетілмеген')}</p>
                )}
                <Link
                  href={`/organizations?dir=${d.id}`}
                  className="inline-flex items-center gap-2 font-bold text-sm"
                  style={{ color: d.color }}
                >
                  {t('Посмотреть организации', 'Ұйымдарды қарау')} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pb-16">
        <Link href="/quiz" className="btn-primary text-base shadow-lg shadow-orange-200">
          {t('Не знаешь направление? Пройди анкету!', 'Бағытты білмейсің бе? Анкетаны өт!')}
        </Link>
      </div>
    </div>
  );
}
