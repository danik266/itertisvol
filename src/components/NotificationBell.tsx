'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { Bell, Heart, MessageCircle, Check, AlertTriangle } from 'lucide-react';

const POLL_MS = 30000;

interface Item {
  _id: string;
  type: 'comment' | 'attend' | 'like' | 'urgent' | 'system';
  text: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  actor?: { firstName?: string; lastName?: string; avatar?: string; orgName?: string; entityType?: string };
}

const ICONS = {
  comment: <MessageCircle size={15} />,
  attend: <Check size={15} />,
  like: <Heart size={15} />,
  urgent: <AlertTriangle size={15} />,
  system: <Bell size={15} />,
};

export default function NotificationBell() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      // сеть подождёт до следующего цикла
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const id = setInterval(() => !document.hidden && load(), POLL_MS);
    return () => clearInterval(id);
  }, [user, load]);

  // Закрытие по клику вне списка.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user) return null;

  const openList = async () => {
    setOpen(v => !v);
    if (!open && unread > 0) {
      setUnread(0);
      setItems(list => list.map(i => ({ ...i, isRead: true })));
      await fetch('/api/notifications', { method: 'PATCH' }).catch(() => {});
    }
  };

  const go = (link: string) => {
    setOpen(false);
    router.push(link);
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={openList}
        className="relative rounded-lg p-2 text-slate-400 transition-colors hover:text-teal-500"
        aria-label={t('Уведомления', 'Хабарламалар')}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="font-display text-sm font-bold">{t('Уведомления', 'Хабарламалар')}</span>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              {t('Пока ничего нового', 'Әзірге жаңалық жоқ')}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map(n => (
                <li key={n._id}>
                  <button
                    onClick={() => go(n.link)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      n.isRead ? '' : 'bg-teal-50/50'
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${
                      n.type === 'urgent' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {ICONS[n.type]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug text-slate-700">{n.text}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
