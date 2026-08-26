import dbConnect from '@/lib/mongodb';
import Direction from '@/models/Direction';
import User from '@/models/User';
import Post from '@/models/Post';

/**
 * Собирает актуальные данные платформы для системного промпта ассистентов.
 * Без этого модель выдумывает направления и разделы, которых на сайте нет.
 * Результат кешируется в памяти процесса на пару минут.
 */
const TTL_MS = 2 * 60 * 1000;
let cache: { text: string; at: number } | null = null;

export async function getSiteContext(): Promise<string> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.text;

  try {
    await dbConnect();
    const [directions, volunteers, announcements, needs] = await Promise.all([
      Direction.find().select('id labelRu descRu').lean(),
      User.countDocuments({ accountType: 'volunteer', role: { $ne: 'admin' }, isBlocked: { $ne: true } }),
      Post.find({ type: 'announcement', status: 'published' })
        .select('text location eventDate')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Post.countDocuments({ type: 'need', status: 'published' }),
    ]);

    const dirList = directions
      .map(d => `- ${d.labelRu}: ${d.descRu || 'направление волонтёрства'}`)
      .join('\n');

    const annList = announcements.length
      ? announcements
          .map(a => {
            const when = a.eventDate
              ? new Date(a.eventDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
              : '';
            const where = a.location ? `, ${a.location}` : '';
            return `- ${String(a.text || '').slice(0, 120)}${when ? ` (${when}${where})` : where}`;
          })
          .join('\n')
      : '- пока нет активных объявлений';

    const text = `АКТУАЛЬНЫЕ ДАННЫЕ ПЛАТФОРМЫ (используй только их, ничего не придумывай):

Разделы сайта:
- Главная — о платформе
- Волонтёры — каталог зарегистрированных волонтёров и организаций, фильтр по направлениям, здесь же QR для регистрации
- Опыт — истории волонтёров с фотографиями
- Объявления — мероприятия и акции, можно отметить «я приду»
- Где мы нужны — просьбы о помощи, можно откликнуться
- Генератор — ИИ-генерация изображений, логотипов, мерча и сценариев (лимит 4 изображения в сутки)

Направления волонтёрства (всего ${directions.length}):
${dirList}

Статистика: зарегистрировано волонтёров и организаций — ${volunteers}; открытых просьб о помощи — ${needs}.

Последние объявления:
${annList}

Как стать волонтёром: зарегистрироваться на странице «Волонтёры» (или отсканировать QR), указать физическое или юридическое лицо, заполнить анкету, обязательно выбрать одно или несколько направлений. После этого можно публиковать опыт, объявления, просьбы о помощи, комментировать и откликаться.`;

    cache = { text, at: Date.now() };
    return text;
  } catch (error) {
    console.error('siteContext error:', error);
    // Без базы ассистент всё равно должен отвечать — отдаём пустой контекст.
    return '';
  }
}
