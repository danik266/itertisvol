'use client';
import { useLang } from '@/lib/LangContext';
import PostFeed from '@/components/PostFeed';

export default function NeedsPage() {
  const { t } = useLang();
  return (
    <PostFeed
      accent="rose"
      type="need"
      title={t('Где мы нужны', 'Біз қажет жерде')}
      subtitle={t(
        'Актуальные просьбы о помощи со всей области. Откликнуться может любой зарегистрированный волонтёр.',
        'Облыс бойынша көмек сұраныстары. Тіркелген кез келген волонтер жауап бере алады.'
      )}
    />
  );
}
