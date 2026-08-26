'use client';
import { useEffect } from 'react';
import { useLang } from '@/lib/LangContext';
import type { DirectionData } from '@/lib/DataContext';
import { Volunteer, displayName, initials } from '@/components/VolunteerCard';
import { X, Building2, MapPin, Briefcase, Globe, Instagram, Facebook, Send } from 'lucide-react';

const SOCIAL_META: Record<string, { label: string; icon: React.ReactNode; href: (v: string) => string }> = {
  instagram: { label: 'Instagram', icon: <Instagram size={16} />, href: v => v },
  facebook: { label: 'Facebook', icon: <Facebook size={16} />, href: v => v },
  telegram: { label: 'Telegram', icon: <Send size={16} />, href: v => v },
  whatsapp: {
    label: 'WhatsApp',
    icon: <Send size={16} />,
    href: v => `https://wa.me/${v.replace(/\D/g, '')}`,
  },
  website: { label: 'Сайт', icon: <Globe size={16} />, href: v => v },
};

export default function VolunteerDialog({
  volunteer,
  directions,
  onClose,
}: {
  volunteer: Volunteer | null;
  directions: DirectionData[];
  onClose: () => void;
}) {
  const { t } = useLang();

  // Закрытие по Esc и блокировка прокрутки фона, пока открыт диалог.
  useEffect(() => {
    if (!volunteer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [volunteer, onClose]);

  if (!volunteer) return null;

  const dirs = (volunteer.directions || [])
    .map(id => directions.find(d => d.id === id))
    .filter(Boolean) as DirectionData[];
  const socials = Object.entries(volunteer.socials || {}).filter(([, v]) => v);
  const isLegal = volunteer.entityType === 'legal';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            {volunteer.avatar ? (
              <img src={volunteer.avatar} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 font-display text-xl font-bold text-white">
                {initials(volunteer)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold text-slate-900">
                {displayName(volunteer)}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Building2 size={12} />
                  {isLegal ? t('юридическое лицо', 'заңды тұлға') : t('физическое лицо', 'жеке тұлға')}
                </span>
                {volunteer.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {volunteer.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={t('Закрыть', 'Жабу')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {volunteer.bio && (
            <p className="text-sm leading-relaxed text-slate-600">{volunteer.bio}</p>
          )}

          {volunteer.activityType && (
            <div>
              <SectionTitle>{t('Вид деятельности', 'Қызмет түрі')}</SectionTitle>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                <Briefcase size={14} className="text-slate-400" />
                {volunteer.activityType}
              </p>
            </div>
          )}

          <div>
            <SectionTitle>{t('Направления волонтёрства', 'Волонтерлік бағыттар')}</SectionTitle>
            {dirs.length ? (
              <div className="mt-3 space-y-2">
                {dirs.map(d => (
                  <div key={d.id} className="rounded-xl p-3" style={{ background: d.bg }}>
                    <div className="text-sm font-bold" style={{ color: d.color }}>
                      {t(d.labelRu, d.labelKz)}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {t(d.descRu, d.descKz)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">{t('Не указано', 'Көрсетілмеген')}</p>
            )}
          </div>

          {socials.length > 0 && (
            <div>
              <SectionTitle>{t('Социальные сети', 'Әлеуметтік желілер')}</SectionTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                {socials.map(([key, value]) => {
                  const meta = SOCIAL_META[key];
                  if (!meta) return null;
                  return (
                    <a
                      key={key}
                      href={meta.href(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      {meta.icon}
                      {meta.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{children}</h3>
  );
}
