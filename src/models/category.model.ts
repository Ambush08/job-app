import mongoose, { Document, Schema, Types} from "mongoose";
import slugify from "slugify";

export interface ICategory extends Document {
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    }
}, { timestamps: true });

categorySchema.pre('validate', function () {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true
        });
    }
});


const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;