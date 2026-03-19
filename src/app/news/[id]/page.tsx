'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import { useData } from '@/lib/DataContext';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLang();
  const { directions } = useData();

  const [evt, setEvt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.event) setEvt(data.event);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-400">
        <div className="text-xl">Загрузка... / Жүктелуде...</div>
      </div>
    );
  }

  if (!evt) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-400">
        <div className="text-xl">Событие не найдено / Іс-шара табылмады</div>
      </div>
    );
  }

  const dir = directions.find(d => d.id === evt.direction);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors mb-6 font-medium"
          >
            <ArrowLeft size={18} /> Назад
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-1.5 rounded-full text-sm font-bold tracking-wide" style={{ background: dir?.bg, color: dir?.color }}>
              {t(dir?.labelRu || '', dir?.labelKz || '')}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-8 leading-tight">
            {t(evt.titleRu, evt.titleKz)}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
            {evt.date && (
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                <Calendar size={18} className="text-teal-500" />
                <span className="font-medium whitespace-nowrap">{evt.date}</span>
              </div>
            )}
            {evt.location && (
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                <MapPin size={18} className="text-teal-500" />
                <span className="font-medium whitespace-nowrap">{evt.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
          
          {evt.image && (
            <div className="mb-10 rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm p-2 flex justify-center items-center">
              <img src={evt.image} alt={evt.titleRu} className="w-full max-h-[500px] object-cover rounded-xl" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          )}

          <div className="prose prose-teal prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {t(evt.contentRu || evt.descRu, evt.contentKz || evt.descKz)}
          </div>
          
        </div>
      </div>
    </div>
  );
}
