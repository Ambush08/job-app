import mongoose, { Schema, Document, Types} from 'mongoose';


export interface IBlog extends Document {
    title: string,
    snippet: string,
    body: string,
    category: 'tech'|'business'|'fashion'|'politics'|'engineering'|'sports',
    postedBy: Types.ObjectId,
    coverImageUrl?: string,
    coverImagePublicId?: string,
    createdAt: Date,
    updatedAt: Date
}

const blogSchema = new Schema<IBlog>({
    title: {
        type: String,
        required: true,
    },
    snippet: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum:['tech','business','fashion','politics','engineering', 'sports'],
        required: true
    },
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coverImageUrl: {
        type: String,
        default: undefined
    },
    coverImagePublicId: {
        type: String,
        default: undefined
    }
}, { timestamps: true });



const Blog = mongoose.model<IBlog>('Blog', blogSchema);

export default Blog;