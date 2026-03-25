import { Router } from 'express';
import { google } from 'googleapis';
import AcademicEvent from '../models/AcademicEvent';
import UserEventMapping from '../models/UserEventMapping';
import { authMiddleware } from './user';

const router = Router();

router.get('/preview', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const { degree, department, specialization, semester, section } = user.profile;

    if (!degree || !department || !specialization || !semester || !section) {
        return res.status(400).json({ error: 'Incomplete profile. Please set your Specialization in Edit Profile.' });
    }

    console.log('SYNC PREVIEW FOR:', { degree, department, specialization, semester, section });

    try {
        const rawEvents = await AcademicEvent.find({
            $or: [
                { isGlobal: true },
                { targetGroups: { $elemMatch: { degree, department, specialization, semester, section } } }
            ]
        });

        // Dedup by _id
        const seen = new Set<string>();
        const events = rawEvents.filter(e => {
            const id = e._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        const counts = {
            classes: events.filter(e => e.type === 'CLASS').length,
            exams: events.filter(e => e.type === 'EXAM').length,
            holidays: events.filter(e => e.type === 'GLOBAL').length,
            total: events.length
        };

        console.log(`FOUND ${events.length} unique events.`, counts);
        res.json({ counts, events });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate preview' });
    }
});

const dayMap: Record<string, string> = { 'Mon': 'MO', 'Tue': 'TU', 'Wed': 'WE', 'Thu': 'TH', 'Fri': 'FR', 'Sat': 'SA', 'Sun': 'SU' };

const getNextDateForDay = (dayName: string, timeString: string) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = days.indexOf(dayName);
    const diff = targetDay >= currentDay ? targetDay - currentDay : 7 - (currentDay - targetDay);

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + diff);

    const [hours, minutes] = timeString.split(':');
    let hr = parseInt(hours, 10);
    if (hr < 8) hr += 12;

    nextDate.setHours(hr, parseInt(minutes || '0', 10), 0, 0);
    return nextDate.toISOString();
};

router.post('/execute', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const { degree, department, specialization, semester, section } = user.profile;
    const { selectedEventIds, eventReminders = {} } = req.body;

    if (!user.tokens.refreshToken) {
        return res.status(401).json({ error: 'Google Calendar access not authorized. Relogin required.' });
    }

    if (!Array.isArray(selectedEventIds) || selectedEventIds.length === 0) {
        return res.status(400).json({ error: 'No events selected for synchronization.' });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
        access_token: user.tokens.accessToken,
        refresh_token: user.tokens.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const getOrCreateCalendar = async (name: string) => {
            const list = await calendar.calendarList.list();
            const existing = list.data.items?.find(c => c.summary === name);
            if (existing) return existing.id!;
            const created = await calendar.calendars.insert({
                requestBody: { summary: name, timeZone: 'Asia/Kolkata' }
            });
            return created.data.id!;
        };

        const classesCalId = await getOrCreateCalendar('Calendrify - Classes');
        const examsCalId = await getOrCreateCalendar('Calendrify - Exams');
        const holidaysCalId = await getOrCreateCalendar('Calendrify - Holidays');

        const calendarIdByType: Record<string, string> = {
            CLASS: classesCalId,
            EXAM: examsCalId,
            GLOBAL: holidaysCalId,
        };

        // 1. Fetch all profile events natively for context (like generating EXDATEs)
        const allProfileEvents = await AcademicEvent.find({
            $or: [
                { isGlobal: true },
                { targetGroups: { $elemMatch: { degree, department, specialization, semester, section } } }
            ]
        });

        // 2. We still need all holidays to compute EXDATE logic, even if the user didn't check the holiday box
        const holidays = allProfileEvents.filter(e => e.type === 'GLOBAL' && e.time.date);

        // 3. Filter down to only the events the user physically checked on the screen
        const eventsToSync = allProfileEvents.filter(e => selectedEventIds.includes(e._id.toString()));

        let syncedCount = 0;

        for (const academicEvent of eventsToSync) {
            const existingMapping = await UserEventMapping.findOne({
                userId: user._id,
                academicEventId: academicEvent._id
            });

            if (!existingMapping) {
                let startProp: any, endProp: any, recurrence: string[] | undefined;

                if (academicEvent.type === 'CLASS' && academicEvent.time.dayOfWeek) {
                    const startDateTime = getNextDateForDay(academicEvent.time.dayOfWeek as string, academicEvent.time.start || '09:00');
                    const endDateTime = getNextDateForDay(academicEvent.time.dayOfWeek as string, academicEvent.time.end || '10:00');
                    startProp = { dateTime: startDateTime, timeZone: 'Asia/Kolkata' };
                    endProp = { dateTime: endDateTime, timeZone: 'Asia/Kolkata' };

                    const untilDate = "20260424T235959Z";
                    const recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${dayMap[academicEvent.time.dayOfWeek as string]};UNTIL=${untilDate}`;

                    // Collect EXDATE offenders: holidays + any exam date that falls on this class's weekday
                    const exams = allProfileEvents.filter(e => e.type === 'EXAM' && e.time.date);
                    const dowIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
                    const classWeekday = dowIndex[academicEvent.time.dayOfWeek as string];

                    const exdateSources: string[] = [];

                    // Holidays (formatted as DD/MM/YYYY)
                    for (const h of holidays) {
                        const [day, month, year] = h.time.date!.split('/');
                        const timeClean = (academicEvent.time.start || '09:00').replace(':', '');
                        exdateSources.push(`${year}${month}${day}T${timeClean}00`);
                    }

                    // Exams on the same weekday (formatted as DD-MM-YYYY)
                    for (const ex of exams) {
                        const [day, month, year] = ex.time.date!.split('-');
                        const examDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        if (examDate.getDay() === classWeekday) {
                            const timeClean = (academicEvent.time.start || '09:00').replace(':', '');
                            exdateSources.push(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}T${timeClean}00`);
                        }
                    }

                    if (exdateSources.length > 0) {
                        recurrence = [recurrenceRule, `EXDATE;TZID=Asia/Kolkata:${exdateSources.join(',')}`];
                    } else {
                        recurrence = [recurrenceRule];
                    }
                }
                else if (academicEvent.type === 'EXAM' && academicEvent.time.date) {
                    const [day, month, year] = academicEvent.time.date.split('-');
                    const isoBase = `${year}-${month}-${day}`;
                    startProp = { dateTime: `${isoBase}T${academicEvent.time.start}:00+05:30` };
                    endProp = { dateTime: `${isoBase}T${academicEvent.time.end}:00+05:30` };
                    recurrence = undefined;
                }
                else if (academicEvent.type === 'GLOBAL' && academicEvent.time.date) {
                    const [day, month, year] = academicEvent.time.date.split('/');
                    const isoBase = `${year}-${month}-${day}`;
                    startProp = { date: isoBase };
                    endProp = { date: isoBase };
                    recurrence = undefined;
                }
                else {
                    continue; // Invalid format
                }

                const titlePrefix = academicEvent.type === 'GLOBAL' ? '[Holiday] ' :
                    academicEvent.type === 'EXAM' ? '[Exam] ' :
                        academicEvent.type === 'CLASS' ? '[Class] ' : '';

                const calendarId = calendarIdByType[academicEvent.type];
                if (!calendarId) continue;

                const gCalEvent = await calendar.events.insert({
                    calendarId,
                    requestBody: {
                        summary: `${titlePrefix}${academicEvent.title}`,
                        location: academicEvent.room,
                        description: `Faculty: ${academicEvent.faculty || 'N/A'}\n\nAuto-synced by Calendrify.`,
                        start: startProp,
                        end: endProp,
                        recurrence: recurrence,
                        reminders: eventReminders[academicEvent._id.toString()] != null
                            ? { useDefault: false, overrides: [{ method: 'popup', minutes: eventReminders[academicEvent._id.toString()] }] }
                            : { useDefault: true },
                        extendedProperties: {
                            private: { calendrifyEventId: academicEvent._id.toString() }
                        }
                    }
                });

                await UserEventMapping.create({
                    userId: user._id,
                    academicEventId: academicEvent._id,
                    googleCalendarEventId: gCalEvent.data.id || '',
                    status: 'SYNCED'
                });

                syncedCount++;
            }
        }

        res.json({ message: `Successfully synced ${syncedCount} specific events to Google Calendar!` });
    } catch (error: any) {
        console.error('Sync execution failed:', error?.message);
        res.status(500).json({ error: `Failed to execute sync with Google API: ${error?.message}` });
    }
});

// ============ WEB CALENDAR MODE ROUTES ============

// Save events to web calendar (no Google API needed)
router.post('/web-save', authMiddleware, async (req: any, res) => {
    const user = req.user;
    const { selectedEventIds } = req.body;

    if (!Array.isArray(selectedEventIds) || selectedEventIds.length === 0) {
        return res.status(400).json({ error: 'No events selected.' });
    }

    try {
        let savedCount = 0;
        for (const eventId of selectedEventIds) {
            // Upsert: create if new, or ensure existing mapping is marked WEB
            const result = await UserEventMapping.findOneAndUpdate(
                { userId: user._id, academicEventId: eventId },
                { $set: { status: 'WEB' } },
                { upsert: true, new: true }
            );
            savedCount++;
        }
        res.json({ message: `Saved ${savedCount} events to your web calendar!` });
    } catch (error: any) {
        res.status(500).json({ error: `Failed to save: ${error?.message}` });
    }
});

// Get all web-calendar events for the user
router.get('/web-events', authMiddleware, async (req: any, res) => {
    try {
        const mappings = await UserEventMapping.find({
            userId: req.user._id,
            status: { $in: ['WEB', 'SYNCED'] },
        }).populate('academicEventId');

        const events = mappings
            .filter(m => m.isCustom || m.academicEventId) // filter out orphans
            .map(m => {
                if (m.isCustom && m.customDetails) {
                    return {
                        mappingId: m._id,
                        _id: m._id, // fallback ID
                        type: 'CUSTOM',
                        title: m.customDetails.title,
                        time: {
                            date: m.customDetails.date,
                            start: m.customDetails.start,
                            end: m.customDetails.end
                        }
                    };
                }
                return {
                    mappingId: m._id,
                    ...(m.academicEventId as any).toObject(),
                };
            });

        res.json({ events });
    } catch (error: any) {
        res.status(500).json({ error: `Failed to fetch web events: ${error?.message}` });
    }
});

// Save a custom user-created event
router.post('/custom-events', authMiddleware, async (req: any, res) => {
    try {
        const { title, date, start, end } = req.body;
        if (!title || !date) return res.status(400).json({ error: 'Title and date are required.' });

        const newEvent = await UserEventMapping.create({
            userId: req.user._id,
            status: 'WEB',
            isCustom: true,
            customDetails: { title, date, start, end }
        });
        res.json({ message: 'Custom event added!', event: newEvent });
    } catch (error: any) {
        res.status(500).json({ error: `Failed to add custom event: ${error?.message}` });
    }
});

// Remove a single event from web calendar
router.delete('/web-events/:mappingId', authMiddleware, async (req: any, res) => {
    try {
        const deleted = await UserEventMapping.findOneAndDelete({
            _id: req.params.mappingId,
            userId: req.user._id,
        });
        if (!deleted) return res.status(404).json({ error: 'Event not found.' });
        res.json({ message: 'Event removed from web calendar.' });
    } catch (error: any) {
        res.status(500).json({ error: `Failed to remove: ${error?.message}` });
    }
});

export default router;

