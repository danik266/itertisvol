import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Уведомления живут только внутри сайта: показываются в колокольчике в шапке,
 * наружу (почта, пуши) ничего не уходит.
 */
export type NotificationType = 'comment' | 'attend' | 'like' | 'urgent' | 'system';

export interface INotification extends Document {
  /** Получатель. */
  user: Types.ObjectId;
  type: NotificationType;
  /** Кто вызвал событие — для аватара и имени в списке. */
  actor?: Types.ObjectId;
  post?: Types.ObjectId;
  text: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['comment', 'attend', 'like', 'urgent', 'system'], required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
    text: { type: String, default: '' },
    link: { type: String, default: '/' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
// Уведомления не нужны вечно: чистим сами через 60 дней.
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

export default (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);
