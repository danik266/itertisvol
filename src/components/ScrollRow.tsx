'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Горизонтальная лента с кнопками прокрутки: на тачпаде и телефоне
 * работает свайп, а с обычной мышью — стрелки по краям.
 */
export default function ScrollRow({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [update, children]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 200), behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`}>
      {canLeft && (
        <Arrow side="left" onClick={() => scrollBy(-1)} />
      )}
      <div
        ref={ref}
        onScroll={update}
        className="scrollbar-none flex gap-2 overflow-x-auto scroll-smooth"
      >
        {children}
      </div>
      {canRight && (
        <Arrow side="right" onClick={() => scrollBy(1)} />
      )}
    </div>
  );
}

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Прокрутить влево' : 'Прокрутить вправо'}
      className={`absolute top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-md transition-colors hover:bg-slate-50 sm:flex ${
        side === 'left' ? '-left-3' : '-right-3'
      }`}
    >
      {side === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}
