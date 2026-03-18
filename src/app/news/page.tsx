'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Calendar, MapPin, CheckCircle } from 'lucide-react';

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

const news = [
  {
    id: 1,
    titleRu: 'IT Ertis Volunteer запускает новый сезон волонтёрства!',
    titleKz: 'IT Ertis Volunteer жаңа волонтерлік маусымын бастайды!',
    bodyRu: 'В этом году мы планируем более 20 мероприятий по всем направлениям. Присоединяйтесь и сделайте город лучше!',
    bodyKz: 'Биыл барлық бағыттар бойынша 20-дан астам іс-шара өткізуді жоспарлаймыз. Қосылыңыз және қаланы жақсы етіңіз!',
    date: '1 мая 2025',
    emoji: '🚀',
    color: '#00BFA6',
  },
  {
    id: 2,
    titleRu: 'Открыт набор волонтёров в Красный Полумесяц',
    titleKz: 'Қызыл жарты айға волонтерлер жиналуда',
    bodyRu: 'Требуются волонтёры для обучения первой помощи. Возраст от 18 лет. Обучение бесплатное.',
    bodyKz: 'Алғашқы көмекке үйрету үшін волонтерлер қажет. Жасы 18-ден. Оқыту тегін.',
    date: '15 апреля 2025',
    emoji: '🌙',
    color: '#ef4444',
  },
  {
    id: 3,
    titleRu: 'Зооволонтёры помогли 50 животным найти дом!',
    titleKz: 'Зооволонтерлер 50 жануарға үй табуға көмектесті!',
    bodyRu: 'За прошлый месяц волонтёры организации «Досым» нашли хозяев для 50 животных из приюта.',
    bodyKz: 'Өткен айда «Досым» ұйымының волонтерлері баспанадан 50 жануарға иелер тапты.',
    date: '10 апреля 2025',
    emoji: '🐾',
    color: '#f59e0b',
  },
];

export default function NewsPage() {
  const { t } = useLang();
  const { user, updateUser } = useAuth();
  const { directions } = useData();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoadingEvents(false));
  }, []);

  const register = async (id: number) => {
    if (user) {
      await updateUser({ appliedEvents: [...(user.appliedEvents || []), id] });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-teal-gradient text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t('Новости и мероприятия', 'Жаңалықтар мен іс-шаралар')}
          </h1>
          <p className="text-white/80">
            {t('Следи за последними событиями и записывайся на мероприятия', 'Соңғы оқиғаларды бақылаңыз және іс-шараларға жазылыңыз')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* News feed */}
          <div className="lg:col-span-1">
            <h2 className="font-display text-xl font-bold mb-6">{t('Новости', 'Жаңалықтар')}</h2>
            <div className="space-y-4">
              {news.map(n => (
                <div key={n.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{n.emoji}</div>
                    <div>
                      <h3 className="font-bold text-sm leading-snug mb-2">{t(n.titleRu, n.titleKz)}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed mb-2">{t(n.bodyRu, n.bodyKz)}</p>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> {n.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-xl font-bold mb-6">{t('Предстоящие мероприятия', 'Алдағы іс-шаралар')}</h2>
            {loadingEvents ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-2">⏳</div>
                <p>{t('Загрузка...', 'Жүктелуде...')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {events.map(e => {
                  const dir = directions.find(d => d.id === e.direction);
                  const isReg = (user?.appliedEvents || []).includes(e.id);
                  return (
                    <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
                      {/* Image placeholder */}
                      {/* Image placeholder */}
                      <div className="relative h-48 flex items-center justify-center text-6xl overflow-hidden bg-gray-100" style={{ background: dir?.bg || '#f3f4f6' }}>
                        {e.image ? (
                          <img src={e.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          e.emoji
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: dir?.bg, color: dir?.color }}>
                            {t(dir?.labelRu || '', dir?.labelKz || '')}
                          </span>
                        </div>
                        <h3 className="font-bold text-base leading-snug mb-2">{t(e.titleRu, e.titleKz)}</h3>
                        <p className="text-gray-500 text-sm mb-4 leading-relaxed">{t(e.descRu, e.descKz)}</p>
                        <div className="space-y-2 mb-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2"><Calendar size={14} /> {e.date}</div>
                          <div className="flex items-center gap-2"><MapPin size={14} /> {e.location}</div>
                        </div>
                        <button
                          onClick={() => register(e.id)}
                          disabled={isReg || !user}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                            isReg
                              ? 'bg-green-50 text-green-600 flex items-center justify-center gap-2 cursor-default'
                              : !user
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                          }`}
                        >
                          {isReg ? <><CheckCircle size={16} /> {t('Записан!', 'Жазылдым!')}</> : t('Записаться', 'Тіркелу')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
