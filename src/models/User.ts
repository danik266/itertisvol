import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  city: string;
  phone: string;
  dob: string;
  direction?: string;
  scores?: Record<string, number>;
  appliedOrgs: number[];
  appliedEvents: number[];
  generationHistory: string[];
  role: 'user' | 'admin';
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
    direction: { type: String, default: '' },
    scores: { type: Schema.Types.Mixed, default: {} },
    appliedOrgs: { type: [Number], default: [] },
    appliedEvents: { type: [Number], default: [] },
    generationHistory: { type: [String], default: [] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
