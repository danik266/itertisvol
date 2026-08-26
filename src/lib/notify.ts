import Notification, { NotificationType } from '@/models/Notification';
import User from '@/models/User';
import { Types } from 'mongoose';

interface NotifyInput {
  user: Types.ObjectId | string;
  type: NotificationType;
  actor?: Types.ObjectId | string;
  post?: Types.ObjectId | string;
  text: string;
  link?: string;
}

/** Уведомление одному человеку. Себе самому не шлём. */
export async function notify({ user, type, actor, post, text, link }: NotifyInput) {
  if (actor && String(actor) === String(user)) return;
  try {
    await Notification.create({ user, type, actor, post, text, link: link || '/' });
  } catch (error) {
    // Уведомление — не критичная часть: молча пропускаем сбой.
    console.error('notify error:', error);
  }
}

/** Рассылка всем волонтёрам — используется для срочных запросов помощи. */
export async function notifyAllVolunteers(input: Omit<NotifyInput, 'user'>) {
  try {
    const users = await User.find({ accountType: 'volunteer', isBlocked: { $ne: true } })
      .select('_id')
      .lean();
    const docs = users
      .filter(u => !input.actor || String(u._id) !== String(input.actor))
      .map(u => ({
        user: u._id,
        type: input.type,
        actor: input.actor,
        post: input.post,
        text: input.text,
        link: input.link || '/needs',
      }));
    if (docs.length) await Notification.insertMany(docs, { ordered: false });
  } catch (error) {
    console.error('notifyAllVolunteers error:', error);
  }
}
