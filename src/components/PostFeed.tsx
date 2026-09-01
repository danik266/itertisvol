'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/lib/LangContext';
import { useData } from '@/lib/DataContext';
import PostComposer from '@/components/PostComposer';
import PostCard, { Post, PostType } from '@/components/PostCard';
import CommentsDialog from '@/components/CommentsDialog';
import QrPanel from '@/components/QrPanel';
import ScrollRow from '@/components/ScrollRow';
import { useAuth } from '@/lib/AuthContext';
import { ACCENTS, AccentName } from '@/lib/accents';
import { Inbox } from 'lucide-react';

const POLL_MS = 12000;

export default function PostFeed({
  type, title, subtitle, qrPath, qrCaption, showMonths, accent = 'teal',
}: {
  type: PostType;
  title: string;
  subtitle: string;
  qrPath?: string;
  qrCaption?: string;
  showMonths?: boolean;
  accent?: AccentName;
}) {
  const { t, lang } = useLang();
  const { directions } = useData();
  const { user } = useAuth();
  const theme = ACCENTS[accent];
  // QR — инструмент ведущего на сцене, посетителям он не нужен.
  const showQr = Boolean(qrPath) && user?.role === 'admin';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [direction, setDirection] = useState('all');
  const [month, setMonth] = useState('all');
  const [openFor, setOpenFor] = useState<Post | null>(null);
  const newestAt = useRef<string | null>(null);
  // Чтобы одна и та же публикация не попала в ленту дважды.
  const knownIds = useRef<Set<string>>(new Set());

  /** Общие условия отбора: у опроса они должны совпадать с основной загрузкой. */
  const baseParams = useCallback(() => {
    const params = new URLSearchParams({ type });
    if (direction !== 'all') params.set('direction', direction);
    if (showMonths && month !== 'all') params.set('month', month);
    return params;
  }, [type, direction, month, showMonths]);

  const load = useCallback(async () => {
    try {
      const params = baseParams();
      params.set('limit', '60');
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const list: Post[] = data.posts || [];
      setPosts(list);
      newestAt.current = list[0]?.createdAt ?? null;
      knownIds.current = new Set(list.map(p => p._id));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [baseParams]);

  useEffect(() => { load(); }, [load]);

  // Список — единственный источник правды о том, что уже показано. Держим
  // отметки в согласии с ним, иначе только что созданная публикация вернётся
  // следующим опросом и покажется второй раз.
  useEffect(() => {
    knownIds.current = new Set(posts.map(p => p._id));
    if (posts[0]) newestAt.current = posts[0].createdAt;
  }, [posts]);

  // Живая лента: подтягиваем только появившееся после последней записи.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        // Пока лента пуста, отсчитывать не от чего — запрашиваем всё подряд,
        // иначе самая первая публикация не появилась бы без перезагрузки.
        const params = baseParams();
        if (newestAt.current) params.set('since', newestAt.current);
        else params.set('limit', '60');

        const res = await fetch(`/api/posts?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        const incoming: Post[] = data.posts || [];
        const fresh = incoming.filter(p => !knownIds.current.has(p._id));
        if (!fresh.length) return;

        newestAt.current = fresh[0].createdAt;
        fresh.forEach(p => knownIds.current.add(p._id));
        setPosts(prev => [...fresh, ...prev]);
      } catch {
        // тихо ждём следующего цикла
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [baseParams]);

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
      <section className={`bg-gradient-to-br ${theme.hero} px-4 py-10 text-white sm:py-14`}>
        <div className={`mx-auto grid max-w-5xl items-center gap-8 ${showQr ? 'lg:grid-cols-[1.2fr_auto]' : ''}`}>
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80">{subtitle}</p>
          </div>
          {showQr && qrPath && (
            <div className="justify-self-center lg:justify-self-end">
              <QrPanel path={qrPath} caption={qrCaption} />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <PostComposer type={type} onCreated={p => setPosts(prev => [p as Post, ...prev])} />

        <ScrollRow className="mt-6">
          <Chip active={direction === 'all'} accent={theme.hex} onClick={() => setDirection('all')}>
            {t('Все', 'Барлығы')}
          </Chip>
          {directions.map(d => (
            <Chip key={d.id} active={direction === d.id} color={d.color} onClick={() => setDirection(d.id)}>
              {t(d.labelRu, d.labelKz)}
            </Chip>
          ))}
        </ScrollRow>

        {showMonths && (
          <ScrollRow className="mt-2">
            <Chip active={month === 'all'} accent={theme.hex} onClick={() => setMonth('all')}>
              {t('Любой месяц', 'Кез келген ай')}
            </Chip>
            {months.map(m => (
              <Chip key={m.value} active={month === m.value} accent={theme.hex} onClick={() => setMonth(m.value)}>
                {m.label}
              </Chip>
            ))}
          </ScrollRow>
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
                onUpdated={next => setPosts(prev => prev.map(x => (x._id === next._id ? next : x)))}
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
  active, color, accent, onClick, children,
}: {
  active: boolean; color?: string; accent?: string;
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        active ? 'text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
      }`}
      style={active ? { background: color || accent || '#0f766e' } : undefined}
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
