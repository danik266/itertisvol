'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { Post, PostAuthor, authorName } from '@/components/PostCard';
import { X, Send, AlertCircle } from 'lucide-react';

interface CommentItem {
  _id: string;
  author: PostAuthor;
  text: string;
  createdAt: string;
}

export default function CommentsDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`);
      const data = await res.json();
      setItems(data.comments || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!post) return;
    load(post._id);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [post, load, onClose]);

  if (!post) return null;

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('Не удалось отправить', 'Жіберу мүмкін болмады'));
        return;
      }
      setItems(list => [...list, data.comment]);
      setText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
         onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl"
           onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold">{t('Комментарии', 'Пікірлер')}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              {t('Пока нет комментариев', 'Әзірге пікір жоқ')}
            </p>
          ) : (
            items.map(c => (
              <div key={c._id} className="flex gap-3">
                {c.author?.avatar ? (
                  <img src={c.author.avatar} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-600">
                    {authorName(c.author).charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold text-slate-800">{authorName(c.author)}</span>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="border-t border-slate-100 p-4">
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {user ? (
            <div className="flex gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={t('Написать комментарий', 'Пікір жазу')}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400"
              />
              <button onClick={send} disabled={busy || !text.trim()}
                      className="rounded-full bg-teal-600 p-3 text-white transition-colors hover:bg-teal-700 disabled:opacity-40">
                <Send size={16} />
              </button>
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500">
              {t('Комментировать могут волонтёры.', 'Пікір жазу тек волонтерлерге.')}{' '}
              <Link href="/auth" className="font-bold text-teal-600 hover:underline">
                {t('Зарегистрироваться', 'Тіркелу')}
              </Link>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
