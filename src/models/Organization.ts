import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganization extends Document {
  orgId: number;
  name: string;
  direction: string;
  descRu: string;
  descKz: string;
  contentRu: string;
  contentKz: string;
  logo: string;
  gallery: string[];
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
  contentRu: { type: String, default: '' },
  contentKz: { type: String, default: '' },
  logo: { type: String, default: '' },
  gallery: { type: [String], default: [] },
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  social: { type: Schema.Types.Mixed, default: {} },
  volunteers: { type: Number, default: 0 },
});

if (mongoose.models.Organization) {
  delete mongoose.models.Organization;
}

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
