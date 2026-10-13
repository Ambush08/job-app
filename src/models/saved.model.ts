import mongoose, { Document, model, Schema, Types} from "mongoose";

export interface ISaved extends Document {
    jobId: Types.ObjectId,
    userId: Types.ObjectId,
    createdAt: Date, 
    updatedAt: Date
}


const savedSchema = new Schema<ISaved>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    jobId: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    }
}, { timestamps: true });

//One save per user per job
savedSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Saved = mongoose.model('Saved', savedSchema);

export default Saved;