'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

interface EventData {
  id: number;
  titleRu: string;
  titleKz: string;
  descRu: string;
  descKz: string;
  date: string;
  location: string;
  direction: string;
  color: string;
  emoji: string;
  image?: string;
}

export default function NewsPage() {
  const { t } = useLang();
  const { directions } = useData();
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoadingEvents(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-teal-gradient text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {t('Новости и события', 'Жаңалықтар мен оқиғалар')}
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl">
            {t('Следите за последними новостями волонтёрского движения, прошедшими мероприятиями и успехами наших лидеров.', 'Волонтерлік қозғалыстың соңғы жаңалықтарын, өткен іс-шараларды және көшбасшыларымыздың жетістіктерін қадағалаңыз.')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loadingEvents ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4 animate-bounce">📰</div>
            <p className="text-lg font-medium">{t('Загрузка новостей...', 'Жаңалықтар жүктелуде...')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(e => {
              const dir = directions.find(d => d.id === e.direction);
              return (
                <div key={e.id} className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col cursor-pointer group" onClick={() => router.push(`/news/${e.id}`)}>
                  {/* Image Header */}
                  <div className="relative h-56 flex items-center justify-center text-7xl bg-gray-50 overflow-hidden" style={{ background: dir?.bg || '#f3f4f6' }}>
                    {e.image ? (
                      <img src={e.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(err) => { err.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span className="group-hover:scale-110 transition-transform duration-500">{e.emoji}</span>
                    )}
                    
                    {/* Floating Direction Badge */}
                    <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 shadow-sm backdrop-blur-md bg-white/90" style={{ color: dir?.color }}>
                      {t(dir?.labelRu || '', dir?.labelKz || '')}
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-display font-bold text-xl leading-snug mb-3 text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                      {t(e.titleRu, e.titleKz)}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-5 leading-relaxed line-clamp-3 flex-1">
                      {t(e.descRu, e.descKz)}
                    </p>
                    
                    <div className="space-y-2 mb-6 text-sm text-gray-500 font-medium">
                      {(e.date || e.location) && <div className="h-px bg-gray-100 w-full mb-4"></div>}
                      {e.date && (
                        <div className="flex items-center gap-2"><Calendar size={16} className="text-teal-500" /> {e.date}</div>
                      )}
                      {e.location && (
                        <div className="flex items-center gap-2"><MapPin size={16} className="text-teal-500" /> {e.location}</div>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <button
                        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-gray-50 text-gray-700 group-hover:bg-teal-500 group-hover:text-white flex flex-row items-center justify-center gap-2"
                      >
                        {t('Подробнее', 'Толығырақ')}
                        <ArrowRight size={16} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
