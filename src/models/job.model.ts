import mongoose, {Schema, Document, Types} from "mongoose";

export interface IJob extends Document {
    title: string;
    description: string;
    company: string;
    location: string;
    skills: string[];
    responsibilities: string[];
    logo: string;
    publicId: string;
    salary: number;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
    postedBy: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}


const jobSchema = new Schema<IJob>({}, {timestamps: true});

const Job = mongoose.model<IJob>('Job', jobSchema);

export default Job;