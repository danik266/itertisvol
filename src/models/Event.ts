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
  contentRu: string;
  contentKz: string;
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
  contentRu: { type: String, default: '' },
  contentKz: { type: String, default: '' },
});

if (mongoose.models.Event) {
  delete mongoose.models.Event;
}
export default mongoose.model<IEvent>('Event', EventSchema);
