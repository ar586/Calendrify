import mongoose, { Schema, Document } from 'mongoose';

export interface IUserEventMapping extends Document {
    userId: mongoose.Types.ObjectId;
    academicEventId?: mongoose.Types.ObjectId;
    googleCalendarEventId?: string;
    status: 'SYNCED' | 'WEB' | 'HIDDEN' | 'MODIFIED';
    isCustom: boolean;
    customDetails?: {
        title: string;
        date: string;
        start?: string;
        end?: string;
    };
}

const UserEventMappingSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        academicEventId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicEvent',
            required: function (this: any) { return !this.isCustom; }
        },
        googleCalendarEventId: { type: String },
        status: { type: String, enum: ['SYNCED', 'WEB', 'HIDDEN', 'MODIFIED'], default: 'SYNCED' },
        isCustom: { type: Boolean, default: false },
        customDetails: {
            title: { type: String },
            date: { type: String }, // format DD/MM/YYYY or similar frontend format
            start: { type: String }, // HH:MM
            end: { type: String }
        }
    },
    { timestamps: true }
);

// Optional: Since academicEventId can be null, we need to adjust the unique index.
// A sparse index on academicEventId helps, or we change how uniqueness is enforced.
UserEventMappingSchema.index(
    { userId: 1, academicEventId: 1 },
    { unique: true, partialFilterExpression: { isCustom: false } }
);

export default mongoose.model<IUserEventMapping>('UserEventMapping', UserEventMappingSchema);
