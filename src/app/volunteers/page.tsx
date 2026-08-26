'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/LangContext';
import { useData } from '@/lib/DataContext';
import QrPanel from '@/components/QrPanel';
import VolunteerCard, { Volunteer } from '@/components/VolunteerCard';
import VolunteerDialog from '@/components/VolunteerDialog';
import ScrollRow from '@/components/ScrollRow';
import { useAuth } from '@/lib/AuthContext';
import { Users, Search, SlidersHorizontal } from 'lucide-react';

const POLL_MS = 10000;

export default function VolunteersPage() {
  const { t } = useLang();
  const { directions } = useData();
  const { user } = useAuth();
  // Блок со сканированием нужен ведущему на сцене, обычным посетителям — нет.
  const showQr = user?.role === 'admin';

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Volunteer | null>(null);
  const [freshIds, setFreshIds] = useState<string[]>([]);

  const newestAt = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/volunteers?limit=120');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const list: Volunteer[] = data.volunteers || [];
      setVolunteers(list);
      setTotal(data.total || list.length);
      newestAt.current = list[0]?.createdAt ?? null;
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Лента в реальном времени: опрашиваем только новые записи.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden || !newestAt.current) return;
      try {
        const res = await fetch(`/api/volunteers?since=${encodeURIComponent(newestAt.current)}`);
        if (!res.ok) return;
        const data = await res.json();
        const fresh: Volunteer[] = data.volunteers || [];
        if (!fresh.length) return;
        newestAt.current = fresh[0].createdAt;
        setVolunteers(prev => [...fresh, ...prev]);
        setTotal(prev => prev + fresh.length);
        setFreshIds(fresh.map(v => v._id));
        setTimeout(() => setFreshIds([]), 4000);
      } catch {
        // молча ждём следующего цикла
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return volunteers.filter(v => {
      const byDir = filter === 'all' || (v.directions || []).includes(filter);
      if (!byDir) return false;
      if (!q) return true;
      const name = `${v.firstName} ${v.lastName} ${v.orgName || ''}`.toLowerCase();
      return name.includes(q) || (v.city || '').toLowerCase().includes(q);
    });
  }, [volunteers, filter, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Знакомство: QR + живая лента */}
      <section className="bg-gradient-to-br from-[#0f5f63] via-[#137b80] to-[#1a9ba1] px-4 py-12 text-white sm:py-16">
        <div className={`mx-auto grid max-w-6xl items-center gap-10 ${showQr ? 'lg:grid-cols-[1.1fr_auto]' : ''}`}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              {t('Знакомство', 'Танысу')}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {t('Давайте знакомиться', 'Танысайық')}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {showQr
                ? t(
                    'Отсканируйте код — и станьте частью единой цифровой платформы волонтёров Павлодарской области.',
                    'Кодты сканерлеңіз — Павлодар облысы волонтерлерінің біртұтас цифрлық платформасының бөлігі болыңыз.'
                  )
                : t(
                    'Волонтёры и организации Павлодарской области — в одном цифровом пространстве.',
                    'Павлодар облысының волонтерлері мен ұйымдары — бір цифрлық кеңістікте.'
                  )}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div>
                <div className="font-display text-3xl font-bold sm:text-4xl">{total}</div>
                <div className="text-sm text-white/70">{t('уже с нами', 'бізбен бірге')}</div>
              </div>
              <Link
                href="/auth"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0f5f63] transition-transform hover:scale-[1.03] active:scale-95"
              >
                {t('Зарегистрироваться', 'Тіркелу')}
              </Link>
            </div>
          </div>

          {showQr && (
            <div className="justify-self-center lg:justify-self-end">
              <QrPanel
                path="/auth"
                caption={t('Наведите камеру телефона', 'Телефон камерасын бағыттаңыз')}
              />
            </div>
          )}
        </div>
      </section>

      {/* Фильтры */}
      <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('Поиск по имени или городу', 'Аты немесе қала бойынша іздеу')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-teal-400 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <SlidersHorizontal size={14} />
              {visible.length} {t('из', 'ішінен')} {volunteers.length}
            </div>
          </div>

          <ScrollRow className="mt-3">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
              {t('Все направления', 'Барлық бағыттар')}
            </FilterChip>
            {directions.map(d => (
              <FilterChip
                key={d.id}
                active={filter === d.id}
                color={d.color}
                onClick={() => setFilter(d.id)}
              >
                {t(d.labelRu, d.labelKz)}
              </FilterChip>
            ))}
          </ScrollRow>
        </div>
      </div>

      {/* Лента волонтёров */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            title={t('Не удалось загрузить волонтёров', 'Волонтерлерді жүктеу мүмкін болмады')}
            hint={t('Проверьте соединение и обновите страницу', 'Байланысты тексеріп, бетті жаңартыңыз')}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title={t('Пока никого нет', 'Әзірге ешкім жоқ')}
            hint={t('Станьте первым — отсканируйте код выше', 'Бірінші болыңыз — жоғарыдағы кодты сканерлеңіз')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(v => (
              <VolunteerCard
                key={v._id}
                volunteer={v}
                directions={directions}
                isNew={freshIds.includes(v._id)}
                onClick={() => setSelected(v)}
              />
            ))}
          </div>
        )}
      </div>

      <VolunteerDialog
        volunteer={selected}
        directions={directions}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        active
          ? 'text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
      style={active ? { background: color || '#0f766e' } : undefined}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <Users size={32} className="mx-auto text-slate-300" />
      <p className="mt-4 font-display text-lg font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{hint}</p>
    </div>
  );
}
