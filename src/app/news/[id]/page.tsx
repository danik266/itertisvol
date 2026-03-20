'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import { useData } from '@/lib/DataContext';
import { ArrowLeft, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

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
          
          {/* Multi-image Slider */}
          {((evt.images && evt.images.length > 0) || evt.image) ? (
            <div className="mb-10 group relative">
              <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm relative">
                <div 
                  id="slider-container"
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none transition-all"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {(evt.images && evt.images.length > 0 ? evt.images : [evt.image]).map((img: string, idx: number) => (
                    <div key={idx} className="min-w-full snap-center flex justify-center items-center bg-white">
                      <img 
                        src={img} 
                        alt={`${evt.titleRu} - ${idx + 1}`} 
                        className="w-full max-h-[500px] object-contain md:object-cover" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                      />
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                {evt.images && evt.images.length > 1 && (
                  <>
                    <button 
                      onClick={() => {
                        const el = document.getElementById('slider-container');
                        if (el) el.scrollBy({ left: -el.offsetWidth, behavior: 'smooth' });
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-gray-800 opacity-0 group-hover:opacity-100 transition-all hover:bg-white active:scale-95 hidden md:flex"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={() => {
                        const el = document.getElementById('slider-container');
                        if (el) el.scrollBy({ left: el.offsetWidth, behavior: 'smooth' });
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-gray-800 opacity-0 group-hover:opacity-100 transition-all hover:bg-white active:scale-95 hidden md:flex"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              {/* Pagination Dots */}
              {evt.images && evt.images.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {evt.images.map((_: any, i: number) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray-200" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            evt.emoji && (
              <div className="mb-10 flex justify-center py-12 bg-gray-50 rounded-3xl text-7xl border border-gray-100 border-dashed">
                {evt.emoji}
              </div>
            )
          )}

          <div className="prose prose-teal prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {t(evt.contentRu || evt.descRu, evt.contentKz || evt.descKz)}
          </div>
          
        </div>
      </div>
    </div>
  );
}
