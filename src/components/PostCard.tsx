'use client';
import { useState } from 'react';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import type { DirectionData } from '@/lib/DataContext';
import { Heart, MessageCircle, MapPin, CalendarDays, Clock, Check, Trash2, Pencil, AlertTriangle, AlertCircle } from 'lucide-react';
import MediaGallery from '@/components/MediaGallery';

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
  eventTime?: string;
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
  post, directions, onOpenComments, onDeleted, onUpdated,
}: {
  post: Post;
  directions: DirectionData[];
  onOpenComments: (post: Post) => void;
  onDeleted: (id: string) => void;
  onUpdated?: (post: Post) => void;
}) {
  const { t, lang } = useLang();
  const { user } = useAuth();

  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(!!user && post.likes?.includes(user._id));
  const [attendees, setAttendees] = useState(post.attendees?.length || 0);
  const [attending, setAttending] = useState(!!user && post.attendees?.includes(user._id));
  const [removing, setRemoving] = useState(false);
  const [editing, setEditing] = useState(false);

  const dir = directions.find(d => d.id === post.direction);
  // Автор правит и убирает своё, главный администратор — любое.
  const canManage = !!user && (user._id === post.author?._id || user.role === 'admin');

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

        {editing ? (
          <EditForm
            post={post}
            directions={directions}
            onCancel={() => setEditing(false)}
            onSaved={updated => { setEditing(false); onUpdated?.(updated); }}
          />
        ) : (
          <>
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
                {post.eventTime && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />{post.eventTime}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {post.media?.length > 0 && <MediaGallery media={post.media} />}

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
        {canManage && (
          <>
            <button
              onClick={() => setEditing(v => !v)}
              aria-label={t('Редактировать', 'Өңдеу')}
              title={t('Редактировать', 'Өңдеу')}
              className={`rounded-full p-2 transition-colors hover:bg-teal-50 hover:text-teal-600 ${
                editing ? 'text-teal-600' : 'text-slate-300'
              } ${post.allowAttend ? '' : 'ml-auto'}`}
            >
              <Pencil size={15} />
            </button>
            <button onClick={remove} disabled={removing}
                    aria-label={t('Удалить', 'Жою')}
                    title={t('Удалить', 'Жою')}
                    className="rounded-full p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </>
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

/** Дата из базы приходит полной меткой времени, а полю нужен формат ГГГГ-ММ-ДД. */
function toDateInput(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/**
 * Правка прямо в карточке, без отдельной страницы: чаще всего исправляют
 * опечатку или переносят время, ради этого уходить со страницы незачем.
 * Вложения формой не меняются — их проще перезалить новой публикацией.
 */
function EditForm({
  post, directions, onCancel, onSaved,
}: {
  post: Post;
  directions: DirectionData[];
  onCancel: () => void;
  onSaved: (post: Post) => void;
}) {
  const { t } = useLang();

  const [text, setText] = useState(post.text || '');
  const [direction, setDirection] = useState(post.direction || '');
  const [location, setLocation] = useState(post.location || '');
  const [eventDate, setEventDate] = useState(toDateInput(post.eventDate));
  const [eventTime, setEventTime] = useState(post.eventTime || '');
  const [isUrgent, setIsUrgent] = useState(!!post.isUrgent);
  const [allowAttend, setAllowAttend] = useState(!!post.allowAttend);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!text.trim() && post.media.length === 0) {
      setError(t('Добавьте текст или медиа', 'Мәтін немесе медиа қосыңыз'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          direction,
          location: post.type === 'experience' ? '' : location,
          eventDate: post.type === 'announcement' ? eventDate || null : undefined,
          eventTime: post.type === 'announcement' ? eventTime : undefined,
          isUrgent: post.type === 'need' ? isUrgent : undefined,
          allowAttend: post.type === 'experience' ? undefined : allowAttend,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('Не удалось сохранить', 'Сақтау мүмкін болмады'));
        return;
      }
      onSaved(data.post as Post);
    } catch {
      setError(t('Ошибка сети', 'Желі қатесі'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-teal-400"
      />

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <select
          value={direction}
          onChange={e => setDirection(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400"
        >
          <option value="">{t('Без направления', 'Бағытсыз')}</option>
          {directions.map(d => (
            <option key={d.id} value={d.id}>{t(d.labelRu, d.labelKz)}</option>
          ))}
        </select>

        {post.type !== 'experience' && (
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={t('Место', 'Орын')}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-400"
            />
          </div>
        )}

        {post.type === 'announcement' && (
          <div className="flex flex-wrap gap-2">
            {/* На узком экране время переносится под дату: иначе поле даты
                сжималось до ста двадцати пикселей и обрезало сам текст. */}
            <div className="relative min-w-[9rem] flex-1">
              <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                aria-label={t('Дата мероприятия', 'Іс-шара күні')}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-400"
              />
            </div>
            <div className="relative w-[7.5rem] grow sm:grow-0">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="time"
                value={eventTime}
                onChange={e => setEventTime(e.target.value)}
                aria-label={t('Время начала', 'Басталу уақыты')}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-2 text-sm outline-none focus:border-teal-400"
              />
            </div>
          </div>
        )}
      </div>

      {post.type !== 'experience' && (
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={allowAttend} onChange={e => setAllowAttend(e.target.checked)}
                   className="h-4 w-4 rounded border-slate-300 accent-teal-600" />
            {t('Кнопка «я приду»', '«Мен келемін» түймесі')}
          </label>
          {post.type === 'need' && (
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)}
                     className="h-4 w-4 rounded border-slate-300 accent-teal-600" />
              {t('Срочно', 'Шұғыл')}
            </label>
          )}
        </div>
      )}

      {post.media?.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          {t('Фото и видео правкой не меняются', 'Фото мен бейне өңдеу арқылы өзгермейді')}
        </p>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={saving}
          className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
        >
          {t('Отмена', 'Бас тарту')}
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
        >
          <Check size={15} />
          {saving ? t('Сохранение...', 'Сақталуда...') : t('Сохранить', 'Сақтау')}
        </button>
      </div>
    </div>
  );
}
