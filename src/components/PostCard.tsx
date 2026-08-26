'use client';
import { useState } from 'react';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import type { DirectionData } from '@/lib/DataContext';
import { Heart, MessageCircle, MapPin, CalendarDays, Check, Trash2, AlertTriangle } from 'lucide-react';

export type PostType = 'experience' | 'need' | 'announcement';

export interface PostAuthor {
  _id: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
  entityType?: 'individual' | 'legal';
  orgName?: string;
  city?: string;
}

export interface Post {
  _id: string;
  type: PostType;
  author: PostAuthor;
  text: string;
  media: { url: string; type: 'image' | 'video' }[];
  direction?: string;
  location?: string;
  eventDate?: string;
  isUrgent?: boolean;
  allowAttend?: boolean;
  attendees: string[];
  likes: string[];
  createdAt: string;
}

export function authorName(a: PostAuthor) {
  if (a?.entityType === 'legal' && a.orgName) return a.orgName;
  return `${a?.firstName || ''} ${a?.lastName || ''}`.trim() || 'Волонтёр';
}

export default function PostCard({
  post, directions, onOpenComments, onDeleted,
}: {
  post: Post;
  directions: DirectionData[];
  onOpenComments: (post: Post) => void;
  onDeleted: (id: string) => void;
}) {
  const { t, lang } = useLang();
  const { user } = useAuth();

  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(!!user && post.likes?.includes(user._id));
  const [attendees, setAttendees] = useState(post.attendees?.length || 0);
  const [attending, setAttending] = useState(!!user && post.attendees?.includes(user._id));
  const [removing, setRemoving] = useState(false);

  const dir = directions.find(d => d.id === post.direction);
  const canDelete = !!user && (user._id === post.author?._id || user.role === 'admin');

  const react = async (action: 'like' | 'attend') => {
    if (!user) return;
    const res = await fetch(`/api/posts/${post._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (action === 'like') { setLiked(data.active); setLikes(data.likes); }
    else { setAttending(data.active); setAttendees(data.attendees); }
  };

  const remove = async () => {
    if (!confirm(t('Удалить публикацию?', 'Жарияланымды жою?'))) return;
    setRemoving(true);
    const res = await fetch(`/api/posts/${post._id}`, { method: 'DELETE' });
    if (res.ok) onDeleted(post._id);
    else setRemoving(false);
  };

  const date = new Date(post.createdAt).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
    day: 'numeric', month: 'long',
  });

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white transition-opacity ${
      post.isUrgent ? 'border-orange-300' : 'border-slate-200'
    } ${removing ? 'opacity-40' : ''}`}>
      {post.isUrgent && (
        <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-orange-700">
          <AlertTriangle size={13} />
          {t('Срочно нужна помощь', 'Шұғыл көмек қажет')}
        </div>
      )}

      <div className="p-4 sm:p-5">
        <header className="flex items-start gap-3">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold text-white">
              {authorName(post.author).charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-slate-900">{authorName(post.author)}</div>
            <div className="text-xs text-slate-400">{date}</div>
          </div>
          {dir && (
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: dir.bg, color: dir.color }}>
              {t(dir.labelRu, dir.labelKz)}
            </span>
          )}
        </header>

        {post.text && (
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
            {post.text}
          </p>
        )}

        {(post.location || post.eventDate) && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
            {post.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400" />{post.location}
              </span>
            )}
            {post.eventDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} className="text-slate-400" />
                {new Date(post.eventDate).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {post.media?.length > 0 && (
        <div className={`grid gap-1 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.media.slice(0, 4).map((m, i) => (
            <img key={i} src={m.url} alt=""
                 className={`w-full object-cover ${post.media.length === 1 ? 'max-h-96' : 'h-40'}`} />
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-1 border-t border-slate-100 px-2 py-2">
        <Action active={liked} onClick={() => react('like')} disabled={!user}
                icon={<Heart size={16} className={liked ? 'fill-current' : ''} />} count={likes} />
        <Action onClick={() => onOpenComments(post)}
                icon={<MessageCircle size={16} />} label={t('Комментарии', 'Пікірлер')} />
        {post.allowAttend && (
          <button
            onClick={() => react('attend')}
            disabled={!user}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${
              attending ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
            }`}
          >
            <Check size={15} />
            {attending ? t('Я приду', 'Мен келемін') : t('Приду', 'Келемін')}
            {attendees > 0 && <span className="opacity-80">{attendees}</span>}
          </button>
        )}
        {canDelete && (
          <button onClick={remove} disabled={removing}
                  className="rounded-full p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500">
            <Trash2 size={15} />
          </button>
        )}
      </footer>
    </article>
  );
}

function Action({
  active, onClick, disabled, icon, count, label,
}: {
  active?: boolean; onClick: () => void; disabled?: boolean;
  icon: React.ReactNode; count?: number; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
        active ? 'text-rose-600' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}
      {typeof count === 'number' && count > 0 && count}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
