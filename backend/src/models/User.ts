import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    googleId: string;
    password?: string;
    tokens: {
        accessToken?: string;
        refreshToken?: string;
        expiryDate?: number;
    };
    profile: {
        department?: string;
        degree?: string;
        specialization?: string;
        year?: string;
        semester?: string;
        section?: string;
    };
}

const UserSchema: Schema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        googleId: { type: String, required: false, unique: true, sparse: true },
        password: { type: String },
        tokens: {
            accessToken: { type: String },
            refreshToken: { type: String },
            expiryDate: { type: Number },
        },
        profile: {
            department: { type: String },
            degree: { type: String },
            specialization: { type: String },
            year: { type: String },
            semester: { type: String },
            section: { type: String },
        },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
