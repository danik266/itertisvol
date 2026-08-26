'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import MediaViewer, { MediaItem } from '@/components/MediaViewer';
import VideoPlayer from '@/components/VideoPlayer';

/**
 * Показ вложений в карточке.
 *
 * Везде object-contain, а не object-cover: снимки с телефона вертикальные,
 * и при обрезке по центру у людей отрезало головы. Лучше поля по бокам,
 * чем испорченный кадр.
 *
 * Несколько файлов — карусель с прокруткой по одному кадру: пальцем смахивается
 * само собой, а мышью работают стрелки по краям.
 */
export default function MediaGallery({ media }: { media: MediaItem[] }) {
  const items = (media || []).filter(m => m && m.url);
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const many = items.length > 1;

  // Следим за прокруткой, чтобы точки и счётчик показывали текущий кадр.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !many) return;
    const onScroll = () => {
      const width = el.clientWidth || 1;
      setIndex(Math.round(el.scrollLeft / width));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [many]);

  const scrollTo = (next: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
  };

  if (!items.length) return null;

  if (!many) {
    const only = items[0];
    return (
      <>
        <div className="relative bg-slate-100">
          {only.type === 'video' ? (
            <VideoPlayer
              src={only.url}
              className="max-h-[70vh] w-full"
              onExpand={() => setOpenAt(0)}
            />
          ) : (
            <button onClick={() => setOpenAt(0)} className="block w-full" aria-label="Открыть фото">
              <img
                src={only.url}
                alt=""
                loading="lazy"
                className="max-h-[70vh] w-full object-contain"
              />
              <ExpandHint />
            </button>
          )}
        </div>
        {openAt !== null && (
          <MediaViewer items={items} index={openAt} onClose={() => setOpenAt(null)} onIndexChange={setOpenAt} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative bg-slate-100">
        <div
          ref={trackRef}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
        >
          {items.map((m, i) => (
            <div key={i} className="aspect-[4/5] w-full shrink-0 snap-center sm:aspect-[16/10]">
              {m.type === 'video' ? (
                <VideoPlayer src={m.url} className="h-full w-full" onExpand={() => setOpenAt(i)} />
              ) : (
                <button
                  onClick={() => setOpenAt(i)}
                  className="relative block h-full w-full"
                  aria-label={`Открыть фото ${i + 1}`}
                >
                  <img src={m.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                </button>
              )}
            </div>
          ))}
        </div>

        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
          {index + 1}/{items.length}
        </span>

        {index > 0 && <SideArrow side="left" onClick={() => scrollTo(index - 1)} />}
        {index < items.length - 1 && <SideArrow side="right" onClick={() => scrollTo(index + 1)} />}

        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {items.map((m, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
              } ${m.type === 'video' ? 'ring-1 ring-white/70' : ''}`}
            />
          ))}
        </div>
      </div>

      {openAt !== null && (
        <MediaViewer items={items} index={openAt} onClose={() => setOpenAt(null)} onIndexChange={setOpenAt} />
      )}
    </>
  );
}

/** Подсказка, что кадр открывается крупнее. На телефоне не мешает — она мелкая. */
function ExpandHint() {
  return (
    <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white">
      <Expand size={14} />
    </span>
  );
}

function SideArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Предыдущий кадр' : 'Следующий кадр'}
      className={`absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-slate-700 shadow-md transition-colors hover:bg-white sm:block ${
        side === 'left' ? 'left-2' : 'right-2'
      }`}
    >
      {side === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}
