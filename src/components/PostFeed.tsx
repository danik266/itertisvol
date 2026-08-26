'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/lib/LangContext';
import { useData } from '@/lib/DataContext';
import PostComposer from '@/components/PostComposer';
import PostCard, { Post, PostType } from '@/components/PostCard';
import CommentsDialog from '@/components/CommentsDialog';
import QrPanel from '@/components/QrPanel';
import { Inbox } from 'lucide-react';

const POLL_MS = 12000;

export default function PostFeed({
  type, title, subtitle, qrPath, qrCaption, showMonths,
}: {
  type: PostType;
  title: string;
  subtitle: string;
  qrPath?: string;
  qrCaption?: string;
  showMonths?: boolean;
}) {
  const { t, lang } = useLang();
  const { directions } = useData();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [direction, setDirection] = useState('all');
  const [month, setMonth] = useState('all');
  const [openFor, setOpenFor] = useState<Post | null>(null);
  const newestAt = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type, limit: '60' });
      if (direction !== 'all') params.set('direction', direction);
      if (showMonths && month !== 'all') params.set('month', month);
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setPosts(data.posts || []);
      newestAt.current = data.posts?.[0]?.createdAt ?? null;
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [type, direction, month, showMonths]);

  useEffect(() => { load(); }, [load]);

  // Живая лента: подтягиваем только появившееся после последней записи.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden || !newestAt.current) return;
      try {
        const params = new URLSearchParams({ type, since: newestAt.current });
        const res = await fetch(`/api/posts?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        const fresh: Post[] = data.posts || [];
        if (!fresh.length) return;
        newestAt.current = fresh[0].createdAt;
        setPosts(prev => {
          const known = new Set(prev.map(p => p._id));
          return [...fresh.filter(p => !known.has(p._id)), ...prev];
        });
      } catch {
        // тихо ждём следующего цикла
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [type]);

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', { month: 'long', year: 'numeric' }),
      };
    });
  }, [lang]);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-[#0f5f63] via-[#137b80] to-[#1a9ba1] px-4 py-10 text-white sm:py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1.2fr_auto]">
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80">{subtitle}</p>
          </div>
          {qrPath && (
            <div className="justify-self-center lg:justify-self-end">
              <QrPanel path={qrPath} caption={qrCaption} />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <PostComposer type={type} onCreated={p => setPosts(prev => [p as Post, ...prev])} />

        <div className="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={direction === 'all'} onClick={() => setDirection('all')}>
            {t('Все', 'Барлығы')}
          </Chip>
          {directions.map(d => (
            <Chip key={d.id} active={direction === d.id} color={d.color} onClick={() => setDirection(d.id)}>
              {t(d.labelRu, d.labelKz)}
            </Chip>
          ))}
        </div>

        {showMonths && (
          <div className="scrollbar-none -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
            <Chip active={month === 'all'} onClick={() => setMonth('all')}>
              {t('Любой месяц', 'Кез келген ай')}
            </Chip>
            {months.map(m => (
              <Chip key={m.value} active={month === m.value} onClick={() => setMonth(m.value)}>
                {m.label}
              </Chip>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />
            ))
          ) : failed ? (
            <Empty title={t('Не удалось загрузить', 'Жүктеу мүмкін болмады')}
                   hint={t('Проверьте соединение', 'Байланысты тексеріңіз')} />
          ) : posts.length === 0 ? (
            <Empty title={t('Пока пусто', 'Әзірге бос')}
                   hint={t('Станьте первым, кто напишет', 'Бірінші болып жазыңыз')} />
          ) : (
            posts.map(p => (
              <PostCard
                key={p._id}
                post={p}
                directions={directions}
                onOpenComments={setOpenFor}
                onDeleted={id => setPosts(prev => prev.filter(x => x._id !== id))}
              />
            ))
          )}
        </div>
      </div>

      <CommentsDialog post={openFor} onClose={() => setOpenFor(null)} />
    </div>
  );
}

function Chip({
  active, color, onClick, children,
}: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        active ? 'text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
      }`}
      style={active ? { background: color || '#0f766e' } : undefined}
    >
      {children}
    </button>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-14 text-center">
      <Inbox size={30} className="mx-auto text-slate-300" />
      <p className="mt-3 font-display text-lg font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{hint}</p>
    </div>
  );
}
