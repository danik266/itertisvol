'use client';
import { useLang } from '@/lib/LangContext';
import PostFeed from '@/components/PostFeed';

export default function AnnouncementsPage() {
  const { t } = useLang();
  return (
    <PostFeed
      type="announcement"
      title={t('Объявления', 'Хабарландырулар')}
      subtitle={t(
        'Мероприятия и акции волонтёров. Отметьте, что придёте, — организатор увидит.',
        'Волонтерлердің іс-шаралары. Келетініңізді белгілеңіз — ұйымдастырушы көреді.'
      )}
      showMonths
    />
  );
}
