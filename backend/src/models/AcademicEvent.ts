import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicEvent extends Document {
    type: 'CLASS' | 'EXAM' | 'HOLIDAY' | 'GLOBAL';
    title: string;
    subjectCode?: string;
    room?: string;
    faculty?: string;
    isGlobal: boolean;
    time: {
        start?: string; // "01:00"
        end?: string;   // "02:00"
        dayOfWeek?: string; // "Mon", "Tue"
        date?: string; // "2026-04-27"
    };
    targetGroups: Array<{
        degree?: string;
        department?: string;
        specialization?: string;
        semester?: string;
        section?: string;
        batch?: string;
    }>;
    hash: string;
}

const AcademicEventSchema: Schema = new Schema(
    {
        type: { type: String, enum: ['CLASS', 'EXAM', 'HOLIDAY', 'GLOBAL'], required: true },
        title: { type: String, required: true },
        subjectCode: { type: String },
        room: { type: String },
        faculty: { type: String },
        isGlobal: { type: Boolean, default: false },
        time: {
            start: { type: String },
            end: { type: String },
            dayOfWeek: { type: String },
            date: { type: String }
        },
        targetGroups: [
            {
                degree: String,
                department: String,
                specialization: String,
                semester: String,
                section: String,
                batch: String,
            },
        ],
        hash: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

export default mongoose.model<IAcademicEvent>('AcademicEvent', AcademicEventSchema);
