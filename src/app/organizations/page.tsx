'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Phone, Mail, Instagram, Facebook, Filter } from 'lucide-react';
import type { Direction } from '@/data';
import Link from 'next/link';

interface OrgData {
  id: number;
  name: string;
  direction: string;
  descRu: string;
  descKz: string;
  city: string;
  phone: string;
  email: string;
  logo: string;
  social: Record<string, string>;
  volunteers: number;
}

export default function OrganizationsPage() {
  const { t } = useLang();
  const { directions } = useData();
  const [filter, setFilter] = useState<any>('all');
  const [organizations, setOrganizations] = useState<OrgData[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load organizations');
        return res.json();
      })
      .then(data => setOrganizations(data.organizations || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoadingOrgs(false));
  }, []);

  const filtered = filter === 'all' ? organizations : organizations.filter(o => o.direction === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-teal-gradient text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t('Волонтёрские организации', 'Волонтерлік ұйымдар')}
          </h1>
          <p className="text-white/80">
            {t('Найди организацию по своему направлению и стань волонтёром', 'Өз бағытыңа сай ұйым тауып, волонтер болыңыз')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Filter size={14} />
            {t('Все', 'Барлығы')}
          </button>
          {directions.map(d => (
            <button
              key={d.id}
              onClick={() => setFilter(d.id as Direction)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === d.id ? 'text-white' : 'text-gray-600 hover:opacity-80'}`}
              style={filter === d.id ? { background: d.color } : { background: d.bg, color: d.color }}
            >
              {d.image ? (
                <img alt="" src={d.image} className="w-5 h-5 rounded-sm object-cover shrink-0" />
              ) : (
                <span>{d.icon}</span>
              )}
              {t(d.labelRu, d.labelKz)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingOrgs ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">⏳</div>
            <p>{t('Загрузка...', 'Жүктелуде...')}</p>
          </div>
        ) : loadError ? (
          <div className="col-span-full text-center py-16 text-gray-500">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="font-medium">{t('Не удалось загрузить организации', 'Ұйымдарды жүктеу мүмкін болмады')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">🏢</div>
            <p>{t('Организаций пока нет', 'Әзірге ұйымдар жоқ')}</p>
          </div>
        ) : filtered.map(org => {
          const dir = directions.find(d => d.id === org.direction);
          return (
            <div key={org.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
              {/* Color header */}
              <div className="min-h-[4.5rem] py-2 flex items-center px-5 gap-3" style={{ background: dir?.bg }}>
                {org.logo ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white shadow-sm p-1 border border-gray-100">
                    <img src={org.logo} alt={org.name} className="w-full h-full object-contain" />
                  </div>
                ) : dir?.image ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white shadow-sm">
                    <img alt="" src={dir?.image} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-3xl">{dir?.icon}</span>
                )}
                <span className="font-bold text-sm" style={{ color: dir?.color }}>
                  {t(dir?.labelRu || '', dir?.labelKz || '')}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-lg mb-2">{org.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {t(org.descRu, org.descKz)}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} />{org.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail size={14} />{org.email}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {org.social?.instagram && (
                    <a href={org.social.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 hover:bg-pink-100 transition-colors">
                      <Instagram size={14} />
                    </a>
                  )}
                  {org.social?.facebook && (
                    <a href={org.social.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors">
                      <Facebook size={14} />
                    </a>
                  )}
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col gap-2">
                    <span className="text-sm font-bold text-green-700">{t('Связаться с организацией:', 'Ұйыммен байланысу:')}</span>
                    {org.phone && (
                      <a href={`tel:${org.phone}`} className="text-sm font-semibold text-gray-700 hover:text-green-600 flex items-center gap-2">
                        <Phone size={14} /> {org.phone}
                      </a>
                    )}
                    {org.email && (
                      <a href={`mailto:${org.email}`} className="text-sm font-semibold text-gray-700 hover:text-green-600 flex items-center gap-2">
                        <Mail size={14} /> {org.email}
                      </a>
                    )}
                    {org.social?.instagram && (
                      <a href={org.social.instagram} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-700 hover:text-pink-500 flex items-center gap-2">
                        <Instagram size={14} /> Instagram
                      </a>
                    )}
                    {org.social?.facebook && (
                      <a href={org.social.facebook} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-700 hover:text-blue-500 flex items-center gap-2">
                        <Facebook size={14} /> Facebook
                      </a>
                    )}
                    {org.social?.whatsapp && (
                      <a href={`https://wa.me/${org.social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-700 hover:text-green-500 flex items-center gap-2">
                        📱 WhatsApp
                      </a>
                    )}
                    {org.social?.telegram && (
                      <a href={org.social.telegram} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-700 hover:text-blue-400 flex items-center gap-2">
                        ✈️ Telegram
                      </a>
                    )}
                  </div>
                
                <div className="mt-6">
                  <Link href={`/organizations/${org.id}`} className="block w-full text-center bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white font-bold py-3 rounded-xl transition-colors">
                    {t('Подробнее', 'Толығырақ')}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
