import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IComment extends Document {
  post: Types.ObjectId;
  author: Types.ObjectId;
  text: string;
  status: 'published' | 'rejected';
  moderationReason: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    status: { type: String, enum: ['published', 'rejected'], default: 'published' },
    moderationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

CommentSchema.index({ post: 1, createdAt: 1 });

export default (mongoose.models.Comment as Model<IComment>) ||
  mongoose.model<IComment>('Comment', CommentSchema);
