'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Phone, Mail, Instagram, Facebook, Users, ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { t } = useLang();
  const { user, updateUser } = useAuth();
  const { directions } = useData();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [localApplied, setLocalApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/organizations/${id}`)
      .then(res => res.json())
      .then(data => setOrg(data.organization))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-4xl animate-bounce">⏳</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-4">{t('Организация не найдена', 'Ұйым табылмады')}</h2>
        <Link href="/organizations" className="text-teal-600 hover:underline">
          {t('Вернуться к списку', 'Тізімге оралу')}
        </Link>
      </div>
    );
  }

  const dir = directions.find(d => d.id === org.direction);
  const isApplied = user?.appliedOrgs?.includes(org.id) || localApplied;

  const apply = async () => {
    if (user && !isApplied) {
      setLocalApplied(true);
      await updateUser({ appliedOrgs: [...(user.appliedOrgs || []), org.id] });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/organizations" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium">
            <ArrowLeft size={18} />
            {t('Назад к организациям', 'Ұйымдарға қайту')}
          </Link>
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {org.logo ? (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 bg-white border border-gray-100 shadow-sm overflow-hidden p-2">
                <img src={org.logo} alt={org.name} className="w-full h-full object-contain" />
              </div>
            ) : dir && (
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: dir.bg, color: dir.color }}
              >
                {dir.image ? (
                  <img src={dir.image} alt={dir.id} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-3xl">{dir.icon}</span>
                )}
              </div>
            )}
            <div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: dir?.bg, color: dir?.color }}>
                {t(dir?.labelRu || '', dir?.labelKz || '')}
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900">{org.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Main Description */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-900">{t('Об организации', 'Ұйым туралы')}</h2>
            <div className="prose prose-teal max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {t(org.contentRu || org.descRu, org.contentKz || org.descKz)}
            </div>
          </section>

          {/* Gallery */}
          {org.gallery && org.gallery.length > 0 && (
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900">{t('Фото и материалы', 'Фото және материалдар')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {org.gallery.map((img: string, i: number) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                    <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-6">{t('Контакты', 'Байланыс')}</h3>
            
            <div className="space-y-4 mb-8">
              {org.phone && (
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Phone size={18} className="shrink-0 text-gray-400 mt-0.5" />
                  <span>{org.phone}</span>
                </div>
              )}
              {org.email && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={18} className="shrink-0 text-gray-400" />
                  <a href={`mailto:${org.email}`} className="hover:text-teal-600 transition-colors">{org.email}</a>
                </div>
              )}
            </div>

            {/* Socials */}
            {org.social && Object.keys(org.social).length > 0 && (
              <div className="flex items-center gap-2 mb-8">
                {org.social.instagram && (
                  <a href={org.social.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 hover:bg-pink-100 transition-colors">
                    <Instagram size={18} />
                  </a>
                )}
                {org.social.facebook && (
                  <a href={org.social.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors">
                    <Facebook size={18} />
                  </a>
                )}
              </div>
            )}

            {user ? (
              <button
                onClick={apply}
                disabled={isApplied}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isApplied
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 hover:-translate-y-0.5'
                }`}
              >
                <Heart size={18} className={isApplied ? "fill-green-700" : ""} />
                {isApplied ? t('Вы поддержали', 'Сіз қолдадыңыз') : t('Поддержать', 'Қолдау көрсету')}
              </button>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100">
                {t('Войдите, чтобы поддержать', 'Қолдау үшін жүйеге кіріңіз')}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
