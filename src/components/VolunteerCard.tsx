'use client';
import { useLang } from '@/lib/LangContext';
import type { DirectionData } from '@/lib/DataContext';
import { Building2, MapPin, User as UserIcon } from 'lucide-react';

export interface Volunteer {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  city?: string;
  directions?: string[];
  entityType?: 'individual' | 'legal';
  orgName?: string;
  activityType?: string;
  socials?: Record<string, string>;
  bio?: string;
  createdAt: string;
}

export function displayName(v: Volunteer) {
  if (v.entityType === 'legal' && v.orgName) return v.orgName;
  return `${v.firstName} ${v.lastName || ''}`.trim();
}

export function initials(v: Volunteer) {
  const name = displayName(v);
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export default function VolunteerCard({
  volunteer,
  directions,
  isNew,
  onClick,
}: {
  volunteer: Volunteer;
  directions: DirectionData[];
  isNew?: boolean;
  onClick: () => void;
}) {
  const { t } = useLang();
  const dirs = (volunteer.directions || [])
    .map(id => directions.find(d => d.id === id))
    .filter(Boolean) as DirectionData[];
  const isLegal = volunteer.entityType === 'legal';

  return (
    <button
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isNew ? 'border-teal-400 ring-2 ring-teal-200' : 'border-slate-200'
      }`}
    >
      {isNew && (
        <span className="absolute right-4 top-4 rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {t('новый', 'жаңа')}
        </span>
      )}

      <div className="flex items-center gap-4">
        {volunteer.avatar ? (
          <img
            src={volunteer.avatar}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 font-display text-lg font-bold text-white">
            {initials(volunteer) || <UserIcon size={20} />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-bold text-slate-900">
            {displayName(volunteer)}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
            {isLegal && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} />
                {t('организация', 'ұйым')}
              </span>
            )}
            {volunteer.city && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin size={12} />
                {volunteer.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {dirs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {dirs.slice(0, 3).map(d => (
            <span
              key={d.id}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: d.bg, color: d.color }}
            >
              {t(d.labelRu, d.labelKz)}
            </span>
          ))}
          {dirs.length > 3 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              +{dirs.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
