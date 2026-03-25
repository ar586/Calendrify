import mongoose from 'mongoose';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import AcademicEvent from '../models/AcademicEvent';
import UserEventMapping from '../models/UserEventMapping';
import connectDB from '../config/db';

dotenv.config({ path: `${__dirname}/../../.env` });

const importDataV3 = async () => {
    await connectDB();

    try {
        console.log('Clearing old events to perform a clean relational ingestion...');
        // Drop collections instantly instead of looping deleteMany
        await AcademicEvent.collection.drop().catch(() => { });
        await UserEventMapping.collection.drop().catch(() => { });

        // 1. Process Classes
        const hajiriPath = '/Users/mac/Desktop/Calendrify/hajiri.timetables.json';
        const hajiriData = JSON.parse(fs.readFileSync(hajiriPath, 'utf-8'));

        let classOps: any[] = [];

        for (const schedule of hajiriData) {
            const { degree, department, specialization, semester, section, timetable } = schedule;
            if (!timetable) continue;
            for (const [dayOfWeek, events] of Object.entries(timetable)) {
                for (const event of events as any[]) {
                    if (!event.subjectCode) continue;

                    // HASH is unique for the class itself (ignoring who takes it)
                    const hashString = `CLASS|${dayOfWeek}|${event.time}|${event.subjectCode}|${specialization || department}|${event.room || ''}|${event.faculty || ''}`;
                    const hash = crypto.createHash('sha256').update(hashString).digest('hex');
                    const [start, end] = event.time.split('-');

                    classOps.push({
                        updateOne: {
                            filter: { hash },
                            update: {
                                $setOnInsert: {
                                    type: 'CLASS',
                                    title: `${event.subjectCode} - ${event.subjectName}`,
                                    subjectCode: event.subjectCode,
                                    room: event.room,
                                    faculty: event.faculty,
                                    isGlobal: false,
                                    time: { start, end, dayOfWeek },
                                    hash
                                },
                                $addToSet: {
                                    targetGroups: { degree, department, specialization: specialization || department, semester, section, batch: event.batch }
                                }
                            },
                            upsert: true
                        }
                    });
                }
            }
        }

        console.log(`Executing ${classOps.length} class bulk operations...`);
        if (classOps.length > 0) await AcademicEvent.bulkWrite(classOps, { ordered: false });
        console.log(`✅ Classes imported successfully!`);

        // 2. Process Global Events
        const eventsPath = '/Users/mac/Desktop/Calendrify/events.json';
        const globalData = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
        let globalOps: any[] = [];

        if (globalData.gazetted_holidays) {
            for (const hol of globalData.gazetted_holidays) {
                const hashString = `HOLIDAY|${hol.date}|${hol.holiday}`;
                const hash = crypto.createHash('sha256').update(hashString).digest('hex');
                globalOps.push({
                    updateOne: {
                        filter: { hash },
                        update: {
                            $setOnInsert: {
                                type: 'GLOBAL',
                                title: hol.holiday,
                                isGlobal: true,
                                time: { date: hol.date },
                                targetGroups: [],
                                hash
                            }
                        },
                        upsert: true
                    }
                });
            }
        }
        console.log(`Executing ${globalOps.length} global holiday operations...`);
        if (globalOps.length > 0) await AcademicEvent.bulkWrite(globalOps, { ordered: false });
        console.log(`✅ Global Holidays imported!`);

        // 2b. Process class-suspended academic events (midsem, moksha, sports, etc.)
        const suspendedKeywords = ['Mid-Semester Examination', 'MOKSHA', 'University Sports Meet', 'Mid Sem B.Tech Project Evaluation'];
        const acadEvents = globalData.academic_schedule?.events || [];
        let suspendedOps: any[] = [];

        const parseDDMMYYYY = (ds: string) => {
            const [d, m, y] = ds.split('/');
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        };
        const fmtDDMMYYYY = (dt: Date) => {
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            return `${dd}/${mm}/${dt.getFullYear()}`;
        };

        for (const ae of acadEvents) {
            const matchedKeyword = suspendedKeywords.find((kw: string) => ae.event.includes(kw));
            if (!matchedKeyword) continue;

            const isMoksha = ae.event.includes('MOKSHA');
            const eventLabel = isMoksha ? 'MOKSHA (Fest)' : ae.event;

            // Expand date ranges into individual days
            const startDate = parseDDMMYYYY(ae.date_from || ae.date);
            const endDate = ae.date_to ? parseDDMMYYYY(ae.date_to) : startDate;

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                if (d.getDay() === 0) continue; // Skip Sundays

                const dateStr = fmtDDMMYYYY(d);
                const hashString = `SUSPENDED|${dateStr}|${ae.event}`;
                const hash = crypto.createHash('sha256').update(hashString).digest('hex');
                suspendedOps.push({
                    updateOne: {
                        filter: { hash },
                        update: {
                            $setOnInsert: {
                                type: 'GLOBAL',
                                title: eventLabel,
                                isGlobal: true,
                                time: { date: dateStr },
                                targetGroups: [],
                                hash
                            }
                        },
                        upsert: true
                    }
                });
            }
        }
        console.log(`Executing ${suspendedOps.length} class-suspended event operations...`);
        if (suspendedOps.length > 0) await AcademicEvent.bulkWrite(suspendedOps, { ordered: false });
        console.log(`✅ Class-suspended events (Midsem, Moksha, Sports, etc.) imported!`);

        // 3. Process Exams
        const endsemPath = '/Users/mac/Desktop/Calendrify/endsem 2026.json';
        const endsemData = JSON.parse(fs.readFileSync(endsemPath, 'utf-8'));
        let examCount = 0;
        let examOps: any[] = [];

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

        // RELATIONAL MAPPING: Fetch all classes ONCE to map subjectCodes to targetGroups in memory
        console.log('Building In-Memory Subject to TargetGroup relation map...');
        const allClasses = await AcademicEvent.find({ type: 'CLASS', targetGroups: { $exists: true, $not: { $size: 0 } } }).lean();
        const subjectCodeToTargets = new Map();

        for (const cls of allClasses) {
            if (!cls.subjectCode) continue;
            if (!subjectCodeToTargets.has(cls.subjectCode)) {
                subjectCodeToTargets.set(cls.subjectCode, new Set());
            }
            const set = subjectCodeToTargets.get(cls.subjectCode);
            // Add unique targetGroups
            cls.targetGroups.forEach((tg: any) => {
                const { _id, ...cleanTg } = tg; // Strip mongo ObjectIds
                set.add(JSON.stringify(cleanTg));
            });
        }

        for (const [program, semesters] of Object.entries(endsemData.exam_schedule)) {
            for (const [semester, exams] of Object.entries(semesters as any)) {
                if (semester === 'notes') continue;
                for (const exam of exams as any[]) {
                    if (subjectCodeToTargets.has(exam.subject_code)) {
                        const targetSet = subjectCodeToTargets.get(exam.subject_code);
                        const uniqueTargets = Array.from(targetSet).map((str: any) => JSON.parse(str));

                        if (uniqueTargets.length > 0) {
                            const hashString = `EXAM|${exam.date}|${exam.subject_code}|${exam.shift}`;
                            const hash = crypto.createHash('sha256').update(hashString).digest('hex');
                            const [start, end] = parseTime(exam.time);

                            examOps.push({
                                updateOne: {
                                    filter: { hash },
                                    update: {
                                        $setOnInsert: {
                                            type: 'EXAM',
                                            title: `${exam.subject_code} - ${exam.subject_name} (Endsem Exam)`,
                                            subjectCode: exam.subject_code,
                                            isGlobal: false,
                                            time: { start, end, date: exam.date },
                                            hash
                                        },
                                        $addToSet: {
                                            targetGroups: { $each: uniqueTargets }
                                        }
                                    },
                                    upsert: true
                                }
                            });
                            examCount++;
                        }
                    }
                }
            }
        }

        console.log(`Executing ${examOps.length} exam bulk operations...`);
        if (examOps.length > 0) await AcademicEvent.bulkWrite(examOps, { ordered: false });
        console.log(`✅ Dynamically Mapped Exams imported!`);

        console.log('🎉 Fast Relational Data Bulk Import V3 Complete!');
        process.exit(0);

    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

importDataV3();
