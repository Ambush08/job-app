import mongoose, { Schema, Document, Types} from "mongoose";

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "rejected"
  | "hired";

export interface IJobApplication extends Document {
    applicantId: Types.ObjectId,
    jobId: Types.ObjectId,
    status: ApplicationStatus,
    resumeUrl: string,
    resumePublicId: string,
    coverLetterUrl?: string,
    coverLetterPublicId?: string,
    createdAt: Date,
    updatedAt: Date
}


const applicationSchema = new Schema<IJobApplication>({
    applicantId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    jobId: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    resumeUrl: {
        type: String,
        required: true
    },
    resumePublicId: {
        type: String,
        required: true
    },
    coverLetterUrl: {
        type: String,
    },
    coverLetterPublicId: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
        default: 'pending'
    }
}, {timestamps: true});


//One application per user per job
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

//Fast my applications lookups
applicationSchema.index({ applicantId: 1, createdAt: -1 });

const Application = mongoose.model<IJobApplication>('Application', applicationSchema);

export default Application;