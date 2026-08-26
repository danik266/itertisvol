'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { User, MapPin, Phone, Mail, LogOut, ClipboardList, Calendar, Zap, ChevronRight } from 'lucide-react';


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

export default function CabinetPage() {
  const { t } = useLang();
  const { user, logout, loading } = useAuth();
  const { directions } = useData();
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(() => {});
  }, []);

  if (loading || !user) return null;

  const userDir = directions.find(d => d.id === user.direction);
  const appliedEvts = events.filter(e => user.appliedEvents?.includes(e.id));

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-teal-gradient text-white py-12 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-display font-bold">
              {user.firstName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-white/75 text-sm">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-bold"
          >
            <LogOut size={16} />
            {t('Выйти', 'Шығу')}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6">
        {/* LEFT: Profile + Direction */}
        <div className="space-y-5">
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <User size={16} className="text-teal-500" />
              {t('Мой профиль', 'Менің профилім')}
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              {user.city && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  {user.city}
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                {user.email}
              </div>
              {user.dob && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  {user.dob}
                </div>
              )}
            </div>
          </div>

          {/* Direction card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <ClipboardList size={16} className="text-teal-500" />
              {t('Моё направление', 'Менің бағытым')}
            </h2>
            {userDir ? (
              <div>
                <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: userDir.bg }}>
                  {userDir.image ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white shadow-sm">
                      <img alt="" src={userDir.image} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <span className="text-3xl">{userDir.icon}</span>
                  )}
                  <div>
                    <div className="font-bold text-sm" style={{ color: userDir.color }}>
                      {t(userDir.labelRu, userDir.labelKz)}
                    </div>
                    <div className="text-xs text-gray-500">{t(userDir.descRu, userDir.descKz)}</div>
                  </div>
                </div>
                {/* Score bars */}
                {user.scores && (
                  <div className="space-y-2">
                    {Object.entries(user.scores)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([key, val]) => {
                        const dir = directions.find(d => d.id === key);
                        if (!dir) return null;
                        const total = Object.values(user.scores!).reduce((a, b) => a + b, 0) || 1;
                        const pct = Math.round((val / total) * 100);
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500 flex items-center gap-1">
                                {dir.image ? <img alt="" src={dir.image} className="w-4 h-4 rounded-sm object-cover" /> : dir.icon} {t(dir.labelRu, dir.labelKz)}
                              </span>
                              <span className="font-bold" style={{ color: dir.color }}>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: dir.color }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                <Link href="/quiz" className="mt-3 text-xs font-bold text-teal-500 hover:text-teal-600 flex items-center gap-1">
                  {t('Пройти анкету заново', 'Анкетаны қайта өту')} <ChevronRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-3">
                  {t('Вы ещё не прошли анкетирование', 'Сіз әлі анкетаны толтырмадыңыз')}
                </p>
                <Link href="/quiz" className="btn-primary text-sm py-2 px-4 inline-block">
                  {t('Пройти анкету', 'Анкетаны өту')}
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-700 mb-3">{t('Быстрые ссылки', 'Жылдам сілтемелер')}</h2>
            <div className="space-y-2">
              {[
                { href: '/volunteers', ru: 'Волонтёры', kz: 'Волонтерлер', icon: '🤝' },
                { href: '/news', ru: 'Мероприятия', kz: 'Іс-шаралар', icon: '📅' },
                { href: '/tasks', ru: 'Генератор', kz: 'Генератор', icon: '⚡' },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-600"
                >
                  <span>{l.icon}</span>
                  {t(l.ru, l.kz)}
                  <ChevronRight size={14} className="ml-auto text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Applications + Events */}
        <div className="md:col-span-2 space-y-6">

          {/* Registered events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              📅 {t('Мои мероприятия', 'Менің іс-шараларым')}
              {appliedEvts.length > 0 && (
                <span className="ml-auto text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {appliedEvts.length}
                </span>
              )}
            </h2>
            {appliedEvts.length > 0 ? (
              <div className="space-y-3">
                {appliedEvts.map(ev => {
                  const dir = directions.find(d => d.id === ev.direction);
                  return (
                    <div key={ev.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden text-xl" style={{ background: dir?.bg || '#f3f4f6' }}>
                            {ev.image ? (
                              <img src={ev.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              ev.emoji
                            )}
                          </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{t(ev.titleRu, ev.titleKz)}</div>
                        <div className="text-xs text-gray-400">{ev.date} · {ev.location}</div>
                      </div>
                      <span className="text-xs font-bold bg-green-100 text-green-600 px-3 py-1 rounded-full">
                        ✓ {t('Записан', 'Жазылды')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">🗓️</div>
                <p className="text-sm">{t('Вы не записаны ни на одно мероприятие', 'Сіз ешбір іс-шараға жазылмадыңыз')}</p>
                <Link href="/news" className="mt-3 inline-block text-teal-500 font-bold text-sm hover:text-teal-600">
                  {t('Посмотреть мероприятия →', 'Іс-шараларды қарау →')}
                </Link>
              </div>
            )}
          </div>

          {/* Generator CTA */}
          <div className="bg-orange-gradient rounded-2xl p-6 text-white flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-lg mb-1">
                {t('Попробуй генератор!', 'Генераторды сынап көр!')}
              </div>
              <p className="text-white/80 text-sm">
                {t('Создай дизайн, логотип или сценарий для своего проекта', 'Жобаңыз үшін дизайн, логотип немесе сценарий жасаңыз')}
              </p>
            </div>
            <Link
              href="/tasks"
              className="flex-shrink-0 bg-white text-orange-500 font-bold px-4 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Zap size={16} />
              {t('Открыть', 'Ашу')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
