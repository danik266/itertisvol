import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDirection extends Document {
  id: string; // "eco", "social" etc.
  icon: string;
  color: string;
  bg: string;
  labelRu: string;
  labelKz: string;
  descRu: string;
  descKz: string;
  tagsRu: string[];
  tagsKz: string[];
  image?: string;
}

const DirectionSchema = new Schema<IDirection>({
  id: { type: String, required: true, unique: true },
  icon: { type: String, default: '' },
  color: { type: String, default: '#000000' },
  bg: { type: String, default: '#ffffff' },
  labelRu: { type: String, required: true },
  labelKz: { type: String, default: '' },
  descRu: { type: String, default: '' },
  descKz: { type: String, default: '' },
  tagsRu: { type: [String], default: [] },
  tagsKz: { type: [String], default: [] },
  image: { type: String, default: '' },
});

export default (mongoose.models.Direction as Model<IDirection>) ||
  mongoose.model<IDirection>('Direction', DirectionSchema);
