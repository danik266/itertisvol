'use client';
import { useLang } from '@/lib/LangContext';
import PostFeed from '@/components/PostFeed';

export default function ExperiencePage() {
  const { t } = useLang();
  return (
    <PostFeed
      type="experience"
      title={t('Опыт волонтёров', 'Волонтерлер тәжірибесі')}
      subtitle={t(
        'Отсканируйте код и расскажите, где вы помогали: фотографии, видео и живые истории.',
        'Кодты сканерлеп, қайда көмектескеніңізді айтыңыз: фото, бейне және шынайы әңгімелер.'
      )}
      qrPath="/experience"
      qrCaption={t('Поделиться своим опытом', 'Тәжірибеңізбен бөлісу')}
    />
  );
}
