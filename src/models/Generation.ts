import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/** Что именно сгенерировали: три вида картинок и текстовый сценарий. */
export type GenerationKind = 'image' | 'merch' | 'logo' | 'scenario';

export interface IGeneration extends Document {
  author: Types.ObjectId;
  kind: GenerationKind;
  /** Запрос волонтёра, как он его написал. */
  prompt: string;
  /** Ссылка на картинку — для всех видов, кроме сценария. */
  imageUrl: string;
  /** Текст сценария. */
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const GenerationSchema = new Schema<IGeneration>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['image', 'merch', 'logo', 'scenario'], required: true },
    prompt: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    text: { type: String, default: '' },
  },
  { timestamps: true }
);

// История всегда читается своя и свежая сверху.
GenerationSchema.index({ author: 1, createdAt: -1 });

export default (mongoose.models.Generation as Model<IGeneration>) ||
  mongoose.model<IGeneration>('Generation', GenerationSchema);
