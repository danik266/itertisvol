'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrPanelProps {
  /** Относительный путь, например /auth — QR соберётся с текущим доменом. */
  path: string;
  caption?: string;
}

/** QR генерируется в браузере: внешние сервисы не задействованы. */
export default function QrPanel({ path, caption }: QrPanelProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const full = `${window.location.origin}${path}`;
    setUrl(full);
    QRCode.toDataURL(full, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f2f33', light: '#ffffff' },
    })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [path]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-slate-900/5 sm:p-5">
        {src ? (
          <img
            src={src}
            alt="QR-код для регистрации"
            className="h-44 w-44 sm:h-56 sm:w-56"
          />
        ) : (
          <div className="h-44 w-44 animate-pulse rounded-2xl bg-slate-100 sm:h-56 sm:w-56" />
        )}
      </div>
      {caption && (
        <p className="max-w-[16rem] text-center text-sm leading-relaxed text-slate-500">{caption}</p>
      )}
      {url && (
        <a
          href={path}
          className="break-all text-center text-xs font-medium text-teal-600 underline-offset-2 hover:underline"
        >
          {url.replace(/^https?:\/\//, '')}
        </a>
      )}
    </div>
  );
}
