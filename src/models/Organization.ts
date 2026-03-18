import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganization extends Document {
  orgId: number;
  name: string;
  direction: string;
  descRu: string;
  descKz: string;
  city: string;
  phone: string;
  email: string;
  social: Record<string, string>;
  volunteers: number;
}

const OrganizationSchema = new Schema<IOrganization>({
  orgId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  direction: { type: String, required: true },
  descRu: { type: String, default: '' },
  descKz: { type: String, default: '' },
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  social: { type: Schema.Types.Mixed, default: {} },
  volunteers: { type: Number, default: 0 },
});

export default (mongoose.models.Organization as Model<IOrganization>) ||
  mongoose.model<IOrganization>('Organization', OrganizationSchema);
