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
    salaryMin: number;
    salaryMax: number;
    experienceLevel: 'Entry' | 'Mid' | 'Senior';
    status: 'Open' | 'Closed';
    category: Types.ObjectId;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
    workplace: 'Remote' | 'On-site' | 'Hybrid';
    postedBy: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}


const jobSchema = new Schema<IJob>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    skills: [{
        type: String,
        trim: true
    }],
    responsibilities: [{
        type: String,
        trim: true
    }],
    logo: {
        type: String,
        default: null
    },
    publicId: {
        type: String,
        default: null
    },
    salaryMin: {
        type: Number,
        min: 0
    },
    salaryMax: {
        type: Number,
        min: 0
    },
    experienceLevel: {
        type: String,
        enum: ['Entry', 'Mid', 'Senior']
    },
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    category: {
        type: Types.ObjectId,
        ref:'Category',
        required: true
    },
    jobType:{
        type: String,
        enum:['Full-time','Part-time','Contract','Internship'],
        required: true
    },
    workplace:{
        type: String,
        enum:['Remote','On-site','Hybrid'],
        required: true
    },
    postedBy:{
        type: Types.ObjectId,
        ref:'User',
        required: true
    }
}, {timestamps:true});

const Job = mongoose.model<IJob>('Job', jobSchema);

export default Job;