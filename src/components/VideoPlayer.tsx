'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

/**
 * Свой проигрыватель вместо стандартного: у браузеров он выглядит по-разному,
 * а на телефоне занимает половину кадра. Здесь одинаковый вид везде и крупная
 * кнопка запуска, по которой удобно попасть пальцем.
 */
export default function VideoPlayer({
  src,
  className = '',
  onExpand,
}: {
  src: string;
  className?: string;
  /** Нажатие на кадр вне кнопок — открыть на весь экран. */
  onExpand?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setCurrent(el.currentTime);
      setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
    };
    const onMeta = () => setDuration(el.duration || 0);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = ref.current;
    if (!el || !el.duration) return;
    el.currentTime = (Number(e.target.value) / 100) * el.duration;
  };

  return (
    <div className={`group relative overflow-hidden bg-black ${className}`}>
      <video
        ref={ref}
        src={src}
        playsInline
        preload="metadata"
        onClick={toggle}
        className="h-full w-full object-contain"
      />

      {/* Крупная кнопка запуска, пока видео на паузе. */}
      {!playing && (
        <button
          onClick={toggle}
          aria-label="Воспроизвести"
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg">
            <Play size={26} className="ml-1 fill-current" />
          </span>
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8">
        <div className="pointer-events-auto flex items-center gap-2">
          <button onClick={toggle} aria-label={playing ? 'Пауза' : 'Воспроизвести'} className="text-white">
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={seek}
            aria-label="Перемотка"
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
          />

          <span className="shrink-0 text-[11px] tabular-nums text-white/90">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <button
            onClick={() => {
              const el = ref.current;
              if (!el) return;
              el.muted = !el.muted;
              setMuted(el.muted);
            }}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            className="text-white"
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {onExpand && (
            <button onClick={onExpand} aria-label="На весь экран" className="text-white">
              <Maximize2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
