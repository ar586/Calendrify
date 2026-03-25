import mongoose from 'mongoose';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import AcademicEvent from '../models/AcademicEvent';
import connectDB from '../config/db';

dotenv.config();

const importData = async () => {
    await connectDB();

    try {
        const filePath = '/Users/mac/Downloads/hajiri.timetables.json';
        const fileData = fs.readFileSync(filePath, 'utf-8');
        const schedules = JSON.parse(fileData);

        let count = 0;

        for (const schedule of schedules) {
            const { degree, department, specialization, year, semester, section, timetable } = schedule;

            if (!timetable) continue; // Skip if timetable is missing

            for (const [dayOfWeek, events] of Object.entries(timetable)) {
                for (const event of events as any[]) {
                    // Construct a unique hash for this specific event occurrence
                    const hashString = `${degree}|${department}|${specialization}|${year}|${semester}|${section}|${dayOfWeek}|${event.time}|${event.subjectCode}|${event.type}|${event.batch}`;
                    const hash = crypto.createHash('sha256').update(hashString).digest('hex');

                    // Check if event already exists
                    const existingEvent = await AcademicEvent.findOne({ hash });

                    if (!existingEvent) {
                        const [start, end] = event.time.split('-');
                        await AcademicEvent.create({
                            type: 'CLASS',
                            title: `${event.subjectCode} - ${event.subjectName}`,
                            room: event.room,
                            faculty: event.faculty,
                            time: {
                                start,
                                end,
                                dayOfWeek
                            },
                            targetGroups: [{
                                degree,
                                department,
                                specialization,
                                year,
                                semester,
                                section,
                                batch: event.batch
                            }],
                            hash
                        });
                        count++;
                    }
                }
            }
        }

        console.log(`Successfully imported ${count} new events!`);
        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

importData();
