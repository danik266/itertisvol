import mongoose, { Schema, Document, Model } from 'mongoose';

export type EntityType = 'individual' | 'legal';
/** Волонтёр попадает в общий каталог, обычный пользователь — нет. */
export type AccountType = 'volunteer' | 'user';

export interface ISocials {
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  facebook?: string;
  website?: string;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  city: string;
  phone: string;
  dob: string;
  accountType: AccountType;
  /** Физическое или юридическое лицо — влияет на набор полей анкеты. */
  entityType: EntityType;
  /** Наименование и вид деятельности заполняют юридические лица. */
  orgName: string;
  activityType: string;
  address: string;
  avatar: string;
  bio: string;
  socials: ISocials;
  /** Волонтёр выбирает одно или несколько направлений при регистрации. */
  directions: string[];
  /** Итог анкеты-квиза, оставлен для обратной совместимости. */
  direction?: string;
  scores?: Record<string, number>;
  /** Отклики «я приду» на объявления и запросы помощи. */
  appliedEvents: number[];
  generationHistory: string[];
  /** Лимит генераций: счётчик за текущие сутки. */
  generationCount: number;
  generationResetAt?: Date;
  /** Модерация: заблокированный не может публиковать. */
  isBlocked: boolean;
  role: 'user' | 'admin';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    city: { type: String, default: '' },
    phone: { type: String, default: '' },
    dob: { type: String, default: '' },
    accountType: { type: String, enum: ['volunteer', 'user'], default: 'volunteer' },
    entityType: { type: String, enum: ['individual', 'legal'], default: 'individual' },
    orgName: { type: String, default: '' },
    activityType: { type: String, default: '' },
    address: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    socials: { type: Schema.Types.Mixed, default: {} },
    directions: { type: [String], default: [] },
    direction: { type: String, default: '' },
    scores: { type: Schema.Types.Mixed, default: {} },
    appliedEvents: { type: [Number], default: [] },
    generationHistory: { type: [String], default: [] },
    generationCount: { type: Number, default: 0 },
    generationResetAt: { type: Date },
    isBlocked: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

// Лента волонтёров сортируется по дате регистрации, фильтруется по направлению.
UserSchema.index({ accountType: 1, createdAt: -1 });
UserSchema.index({ directions: 1 });

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
