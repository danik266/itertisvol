import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  eventId: number;
  titleRu: string;
  titleKz: string;
  descRu: string;
  descKz: string;
  date: string;
  location: string;
  direction: string;
  color: string;
  emoji: string;
  image?: string;
}

const EventSchema = new Schema<IEvent>({
  eventId: { type: Number, required: true, unique: true },
  titleRu: { type: String, required: true },
  titleKz: { type: String, default: '' },
  descRu: { type: String, default: '' },
  descKz: { type: String, default: '' },
  date: { type: String, default: '' },
  location: { type: String, default: '' },
  direction: { type: String, default: '' },
  color: { type: String, default: '' },
  emoji: { type: String, default: '' },
  image: { type: String, default: '' },
});

export default (mongoose.models.Event as Model<IEvent>) ||
  mongoose.model<IEvent>('Event', EventSchema);
