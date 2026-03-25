import mongoose from 'mongoose';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import AcademicEvent from '../models/AcademicEvent';
import UserEventMapping from '../models/UserEventMapping';
import connectDB from '../config/db';

dotenv.config({ path: `${__dirname}/../../.env` });

const importDataV2 = async () => {
    await connectDB();

    try {
        console.log('Clearing old events to perform a clean relational ingestion...');
        await AcademicEvent.deleteMany({});
        await UserEventMapping.deleteMany({});

        // 1. Process Classes
        const hajiriPath = '/Users/mac/Desktop/Calendrify/hajiri.timetables.json';
        const hajiriData = JSON.parse(fs.readFileSync(hajiriPath, 'utf-8'));
        let classCount = 0;

        for (const schedule of hajiriData) {
            const { degree, department, semester, section, timetable } = schedule;
            if (!timetable) continue;
            for (const [dayOfWeek, events] of Object.entries(timetable)) {
                for (const event of events as any[]) {
                    if (!event.subjectCode) continue;

                    const hashString = `CLASS|${degree}|${department}|${semester}|${section}|${dayOfWeek}|${event.time}|${event.subjectCode}|${event.batch}`;
                    const hash = crypto.createHash('sha256').update(hashString).digest('hex');

                    const existingEvent = await AcademicEvent.findOne({ hash });
                    if (!existingEvent) {
                        const [start, end] = event.time.split('-');
                        await AcademicEvent.create({
                            type: 'CLASS',
                            title: `${event.subjectCode} - ${event.subjectName}`,
                            subjectCode: event.subjectCode,
                            room: event.room,
                            faculty: event.faculty,
                            isGlobal: false,
                            time: { start, end, dayOfWeek },
                            targetGroups: [{ degree, department, semester, section, batch: event.batch }],
                            hash
                        });
                        classCount++;
                    }
                }
            }
        }
        console.log(`✅ Classes imported: ${classCount}`);

        // 2. Process Global Events
        const eventsPath = '/Users/mac/Desktop/Calendrify/events.json';
        const globalData = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
        let globalCount = 0;

        if (globalData.gazetted_holidays) {
            for (const hol of globalData.gazetted_holidays) {
                const hashString = `HOLIDAY|${hol.date}|${hol.holiday}`;
                const hash = crypto.createHash('sha256').update(hashString).digest('hex');
                await AcademicEvent.create({
                    type: 'GLOBAL',
                    title: hol.holiday,
                    isGlobal: true,
                    time: { date: hol.date },
                    hash
                });
                globalCount++;
            }
        }
        console.log(`✅ Global Holidays imported: ${globalCount}`);

        // 3. Process Exams
        const endsemPath = '/Users/mac/Desktop/Calendrify/endsem 2026.json';
        const endsemData = JSON.parse(fs.readFileSync(endsemPath, 'utf-8'));
        let examCount = 0;

        const parseTime = (rawTime: string) => {
            const parts = rawTime.split(' To ');
            if (parts.length !== 2) return ["", ""];
            const convert = (t: string) => {
                const [time, modifier] = t.split(' ');
                let [hours, minutes] = time.split(':');
                if (hours === '12' && modifier === 'AM') hours = '00';
                if (hours !== '12' && modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
                return `${hours.padStart(2, '0')}:${minutes}`;
            };
            return [convert(parts[0]), convert(parts[1])];
        };

        for (const [program, semesters] of Object.entries(endsemData.exam_schedule)) {
            for (const [semester, exams] of Object.entries(semesters as any)) {
                for (const exam of exams as any[]) {
                    // RELATIONAL MAPPING: Find classes that map to this exam's subject code
                    const classesWithSubject = await AcademicEvent.find({ type: 'CLASS', subjectCode: exam.subject_code });
                    const targetGroups: any[] = [];
                    classesWithSubject.forEach(c => {
                        targetGroups.push(...c.targetGroups);
                    });

                    // Only map if students exist for this exam
                    if (targetGroups.length > 0) {
                        const hashString = `EXAM|${exam.date}|${exam.subject_code}|${exam.shift}`;
                        const hash = crypto.createHash('sha256').update(hashString).digest('hex');

                        const existingEvent = await AcademicEvent.findOne({ hash });
                        if (!existingEvent) {
                            const [start, end] = parseTime(exam.time);

                            // Deduplicate target groups to avoid bloated arrays
                            const uniqueTargets = Array.from(new Set(targetGroups.map(a => JSON.stringify(a))))
                                .map(id => JSON.parse(id));

                            await AcademicEvent.create({
                                type: 'EXAM',
                                title: `${exam.subject_code} - ${exam.subject_name} (Endsem Exam)`,
                                subjectCode: exam.subject_code,
                                isGlobal: false,
                                time: { start, end, date: exam.date },
                                targetGroups: uniqueTargets, // Assigned dynamically!
                                hash
                            });
                            examCount++;
                        }
                    }
                }
            }
        }
        console.log(`✅ Dynamically Mapped Exams imported: ${examCount}`);

        console.log('🎉 Relational Data Import V2 Complete!');
        process.exit(0);

    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

importDataV2();
