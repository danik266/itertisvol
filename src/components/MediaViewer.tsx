'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

/**
 * Просмотр во весь экран. Картинка вписывается целиком — ничего не обрезается,
 * в том числе вертикальные снимки с телефона. Листается стрелками, клавишами
 * и смахиванием пальцем.
 */
export default function MediaViewer({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const many = items.length > 1;
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (step: number) => {
      if (!many) return;
      onIndexChange((index + step + items.length) % items.length);
    },
    [index, items.length, many, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    // Пока открыт просмотр, страница под ним не должна прокручиваться.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [go, onClose]);

  const item = items[index];
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={onClose}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null) return;
        const delta = e.changedTouches[0].clientX - start;
        if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm text-white/70">
          {many ? `${index + 1} из ${items.length}` : ''}
        </span>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
        >
          <X size={20} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2 pb-4">
        {item.type === 'video' ? (
          <div className="max-h-full w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <VideoPlayer src={item.url} className="max-h-[80vh] rounded-xl" />
          </div>
        ) : (
          <img
            src={item.url}
            alt=""
            onClick={e => e.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
        )}

        {many && (
          <>
            <Arrow side="left" onClick={() => go(-1)} />
            <Arrow side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {many && (
        <div className="flex justify-center gap-1.5 pb-5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); onIndexChange(i); }}
              aria-label={`Кадр ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      aria-label={side === 'left' ? 'Предыдущий' : 'Следующий'}
      className={`absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25 sm:block ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
    >
      {side === 'left' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  );
}
