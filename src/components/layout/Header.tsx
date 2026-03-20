'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, Eye, User, Sparkles } from 'lucide-react';

export default function Header() {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [accessible, setAccessible] = useState(false);

  const toggleAccessible = () => {
    setAccessible(!accessible);
    document.documentElement.classList.toggle('accessible', !accessible);
  };

  const nav = [
    { href: '/main', labelRu: 'Главная', labelKz: 'Басты бет' },
    { href: '/organizations', labelRu: 'Организации', labelKz: 'Ұйымдар' },
    { href: '/directions', labelRu: 'Направления', labelKz: 'Бағыттар' },
    { href: '/news', labelRu: 'Новости', labelKz: 'Жаңалықтар' },
    { href: '/tasks', labelRu: 'Генератор', labelKz: 'Генератор' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/main" className="flex flex-col leading-none group">
          <div className="flex items-center gap-1">
            <span className="font-display font-light text-xl tracking-tight text-slate-700 transition-colors group-hover:text-slate-900">IT</span>
            <span className="font-display font-bold text-xl tracking-tight text-teal-500 transition-colors group-hover:text-teal-600">ERTIS</span>
            <Sparkles className="text-yellow-400 fill-yellow-400 w-4 h-4 -mt-1 drop-shadow-sm" />
          </div>
          <div className="font-display font-black text-[10px] tracking-[0.25em] text-orange-500 ml-0.5 mt-[-2px]">VOLUNTEER</div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm font-semibold text-gray-600 hover:text-teal-500 transition-colors"
            >
              {t(n.labelRu, n.labelKz)}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Accessible */}
          <button
            onClick={toggleAccessible}
            title={t('Версия для слабовидящих', 'Нашар көретіндер нұсқасы')}
            className={`p-2 rounded-lg transition-colors ${accessible ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-teal-500'}`}
          >
            <Eye size={18} />
          </button>

          {/* Lang switch */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLang('ru')}
              className={`text-xs font-bold px-2 py-1 rounded-md transition-all ${lang === 'ru' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
            >RU</button>
            <button
              onClick={() => setLang('kz')}
              className={`text-xs font-bold px-2 py-1 rounded-md transition-all ${lang === 'kz' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
            >ҚЗ</button>
          </div>

          {/* Admin link */}
          {user?.role === 'admin' && (
            <Link href="/admin" className="hidden sm:inline-flex items-center gap-2 bg-red-50 text-red-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
              Админ
            </Link>
          )}

          {/* Auth */}
          {user ? (
            <Link href="/cabinet" className="flex items-center gap-2 bg-teal-50 text-teal-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-teal-100 transition-colors">
              <User size={16} />
              <span className="hidden sm:block">{user.firstName}</span>
            </Link>
          ) : (
            <Link href="/auth" className="btn-primary text-sm py-2 px-4">
              {t('Войти', 'Кіру')}
            </Link>
          )}

          {/* Mobile burger */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-semibold text-gray-700 hover:text-teal-500 py-2"
            >
              {t(n.labelRu, n.labelKz)}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
