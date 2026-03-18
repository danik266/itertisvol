'use client';
import Link from 'next/link';
import { useLang } from '@/lib/LangContext';
import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-teal-gradient flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">IT</span>
            </div>
            <span className="font-display font-bold text-base">
              <span className="text-teal-400">ERTIS</span>
              <span className="text-orange-400"> VOL</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            {t('Платформа, где встречаются IT-специалисты и гражданские активисты.', 'IT-мамандар мен азаматтық белсенділер кездесетін платформа.')}
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-bold mb-4 text-teal-400">{t('Навигация', 'Навигация')}</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {[
              { href: '/', ru: 'Главная', kz: 'Басты бет' },
              { href: '/organizations', ru: 'Организации', kz: 'Ұйымдар' },
              { href: '/directions', ru: 'Направления', kz: 'Бағыттар' },
              { href: '/news', ru: 'Новости', kz: 'Жаңалықтар' },
              { href: '/tasks', ru: 'Генератор', kz: 'Генератор' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-teal-400 transition-colors">
                  {t(l.ru, l.kz)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacts */}
        <div>
          <h4 className="font-bold mb-4 text-teal-400">{t('Контакты', 'Байланыс')}</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-2"><Phone size={14} /><span>+7 (7182) 55-11-22</span></li>
            <li className="flex items-center gap-2"><Mail size={14} /><span>info@itvoleneer.kz</span></li>
            <li className="flex items-center gap-2"><MapPin size={14} /><span>Павлодар, Казахстан</span></li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h4 className="font-bold mb-4 text-teal-400">{t('Соцсети', 'Әлеуметтік желілер')}</h4>
          <div className="flex gap-3">
            <a href="https://instagram.com/itvolunteer_pvl" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-500 transition-colors">
              <Instagram size={18} />
            </a>
            <a href="https://facebook.com/itvolunteer.pvl" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-500 transition-colors">
              <Facebook size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 text-center py-4 text-gray-500 text-xs">
        © 2025 IT Ertis Volunteer. {t('Все права защищены.', 'Барлық құқықтар қорғалған.')}
      </div>
    </footer>
  );
}
