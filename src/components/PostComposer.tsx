'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { uploadMedia, ACCEPTED_MEDIA } from '@/lib/uploadMedia';
import type { PostType } from '@/components/PostCard';
import { ImagePlus, X, AlertCircle, Send, CalendarDays, MapPin, Clock } from 'lucide-react';

const MAX_MEDIA = 6;

export default function PostComposer({
  type,
  onCreated,
}: {
  type: PostType;
  onCreated: (post: unknown) => void;
}) {
  const { t } = useLang();
  const { user } = useAuth();
  const { directions } = useData();

  const [text, setText] = useState('');
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [direction, setDirection] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [allowAttend, setAllowAttend] = useState(type !== 'experience');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">
          {t('Публиковать могут все, кто вошёл в аккаунт', 'Аккаунтқа кірген кез келген адам жариялай алады')}
        </p>
        <Link
          href="/auth"
          className="mt-3 inline-block rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-700"
        >
          {t('Зарегистрироваться', 'Тіркелу')}
        </Link>
      </div>
    );
  }

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    const room = MAX_MEDIA - media.length;
    try {
      for (const file of Array.from(files).slice(0, room)) {
        try {
          const item = await uploadMedia(file);
          setMedia(m => [...m, item]);
        } catch (e) {
          setError(e instanceof Error ? e.message : t('Не удалось загрузить файл', 'Файлды жүктеу мүмкін болмады'));
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!text.trim() && media.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, text, media, direction,
          location: location || undefined,
          eventDate: eventDate || undefined,
          eventTime: eventTime || undefined,
          isUrgent, allowAttend,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('Не удалось опубликовать', 'Жариялау мүмкін болмады'));
        return;
      }
      onCreated(data.post);
      setText(''); setMedia([]); setLocation(''); setEventDate(''); setEventTime(''); setIsUrgent(false);
    } catch {
      setError(t('Ошибка сети', 'Желі қатесі'));
    } finally {
      setBusy(false);
    }
  };

  const placeholder =
    type === 'experience'
      ? t('Расскажите о своём волонтёрском опыте', 'Волонтерлік тәжірибеңіз туралы айтыңыз')
      : type === 'need'
      ? t('Опишите, где и какая помощь нужна', 'Қайда және қандай көмек керектігін жазыңыз')
      : t('О чём хотите объявить?', 'Не туралы хабарлағыңыз келеді?');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-teal-400"
      />

      {media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((m, i) => (
            <div key={i} className="relative">
              {m.type === 'video' ? (
                <video src={m.url} className="h-20 w-20 rounded-xl object-cover" muted />
              ) : (
                <img src={m.url} alt="" className="h-20 w-20 rounded-xl object-cover" />
              )}
              <button
                onClick={() => setMedia(list => list.filter((_, idx) => idx !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-900 p-1 text-white"
                aria-label={t('Убрать', 'Алып тастау')}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          value={direction}
          onChange={e => setDirection(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400"
        >
          <option value="">{t('Направление (необязательно)', 'Бағыт (міндетті емес)')}</option>
          {directions.map(d => (
            <option key={d.id} value={d.id}>{t(d.labelRu, d.labelKz)}</option>
          ))}
        </select>

        {type !== 'experience' && (
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

        {type === 'announcement' && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                aria-label={t('Дата мероприятия', 'Іс-шара күні')}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-400"
              />
            </div>
            {/* Время необязательное: часть объявлений живёт без точного часа. */}
            <div className="relative w-[7.5rem] shrink-0">
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

      {type !== 'experience' && (
        <div className="mt-3 flex flex-wrap gap-4">
          <Toggle checked={allowAttend} onChange={setAllowAttend}>
            {t('Кнопка «я приду»', '«Мен келемін» түймесі')}
          </Toggle>
          {type === 'need' && (
            <Toggle checked={isUrgent} onChange={setIsUrgent}>
              {t('Срочно', 'Шұғыл')}
            </Toggle>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={media.length >= MAX_MEDIA || uploading}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
        >
          <ImagePlus size={16} />
          {uploading ? t('Загрузка...', 'Жүктелуде...') : t('Фото или видео', 'Фото не бейне')}
          {media.length > 0 && ` ${media.length}/${MAX_MEDIA}`}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_MEDIA}
          multiple
          onChange={e => addFiles(e.target.files)}
          className="hidden"
        />
        <button
          onClick={submit}
          disabled={busy || uploading || (!text.trim() && media.length === 0)}
          className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
        >
          <Send size={15} />
          {busy ? t('Отправка...', 'Жіберілуде...') : t('Опубликовать', 'Жариялау')}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  checked, onChange, children,
}: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-teal-600"
      />
      {children}
    </label>
  );
}
