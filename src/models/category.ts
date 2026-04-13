import mongoose, { Document, Schema, Model } from 'mongoose';

interface CategoryDocument extends Document {
  name: string;
}

const categorySchema = new Schema<CategoryDocument>({
  name: { type: String, required: true },
});

const Category: Model<CategoryDocument> =
  mongoose.models.Category || mongoose.model<CategoryDocument>('Category', categorySchema);

export default Category;
