import mongoose, {Schema, Types, Document} from 'mongoose';

export interface IUser {
    email: string,
    firstName: string,
    lastName: string,
    passwordHash: string,
    role: 'User' | 'Admin',
    profile: string | undefined,
    publicId: string | undefined,
    tokenVersion: number,
    emailVerified: boolean,
    twoFactorEnabled: boolean,
    twoFactorSecret: string | undefined,
    accountType: 'Basic' | 'Premium',
    passwordResetToken: string | undefined
    passwordResetExpires: Date | undefined,
    createdAt: Date,
    updatedAt: string
}


const userSchema = new Schema<IUser>({
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        minLength: 3
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minLength: 3
    },
    role: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    },
    passwordHash: {
        type: String,
        required: true,
        minLength: 8,
        select: false
    },
    profile: {
        type: String,
        default: undefined
    },
    publicId: {
        type: String,
        default: undefined
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: undefined
    },
    accountType: {
        type: String,
        enume: ['Basic', 'Premium'],
        default: 'Basic'
    },
    passwordResetToken: {
        type: String,
        default: undefined
    },
    passwordResetExpires: {
        type: Date,
        default: undefined
    }

}, { timestamps: true});


const User = mongoose.model('User', userSchema);

export default User;