import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Одна сущность на три сценария: истории опыта (этап 2), запросы помощи
 * (этап 3, «Где мы нужны») и объявления о мероприятиях. Устройство у них
 * одинаковое — автор, медиа, лайки, комментарии, модерация.
 */
export type PostType = 'experience' | 'need' | 'announcement';
export type PostStatus = 'published' | 'pending' | 'rejected';

export interface IMedia {
  url: string;
  type: 'image' | 'video';
}

export interface IPost extends Document {
  type: PostType;
  author: Types.ObjectId;
  text: string;
  media: IMedia[];
  direction: string;
  /** Место, где нужна помощь, — заполняется для запросов. */
  location: string;
  /** Дата события — по ней объявления группируются по месяцам. */
  eventDate?: Date;
  isUrgent: boolean;
  /** Автор решает, показывать ли кнопку «я приду». */
  allowAttend: boolean;
  attendees: Types.ObjectId[];
  likes: Types.ObjectId[];
  status: PostStatus;
  moderationReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
  },
  { _id: false }
);

const PostSchema = new Schema<IPost>(
  {
    type: { type: String, enum: ['experience', 'need', 'announcement'], required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    media: { type: [MediaSchema], default: [] },
    direction: { type: String, default: '' },
    location: { type: String, default: '' },
    eventDate: { type: Date },
    isUrgent: { type: Boolean, default: false },
    allowAttend: { type: Boolean, default: false },
    attendees: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    likes: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    status: { type: String, enum: ['published', 'pending', 'rejected'], default: 'published' },
    moderationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Ленты всегда читаются по типу и свежести, объявления — ещё и по дате события.
PostSchema.index({ type: 1, status: 1, createdAt: -1 });
PostSchema.index({ type: 1, eventDate: 1 });

export default (mongoose.models.Post as Model<IPost>) || mongoose.model<IPost>('Post', PostSchema);
