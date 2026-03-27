'use client';
import { useState, useEffect, useCallback } from 'react';

interface WebEvent {
    mappingId: string;
    _id: string;
    type: 'CLASS' | 'EXAM' | 'GLOBAL' | 'CUSTOM';
    title: string;
    subjectCode?: string;
    room?: string;
    faculty?: string;
    time: {
        start?: string;
        end?: string;
        dayOfWeek?: string;
        date?: string;
    };
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parseHour(timeStr: string): number {
    if (!timeStr) return 9;
    const [h] = timeStr.split(':');
    let hour = parseInt(h, 10);
    if (hour >= 1 && hour < 8) hour += 12;
    return hour;
}

function formatTime12(timeStr: string): string {
    if (!timeStr) return '';
    let hour = parseInt(timeStr.split(':')[0], 10);
    const min = timeStr.split(':')[1] || '00';
    if (hour >= 1 && hour < 8) hour += 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${min} ${ampm}`;
}

// Parse DD/MM/YYYY or DD-MM-YYYY to Date
function parseDateStr(dateStr: string): Date | null {
    if (!dateStr) return null;
    const sep = dateStr.includes('/') ? '/' : '-';
    const [d, m, y] = dateStr.split(sep);
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

const TYPE_COLORS = {
    CLASS: { dot: 'bg-[#4A3C31]', bg: 'bg-[#F2EFE9]', border: 'border-[#D4CBB8]', text: 'text-[#4A3C31]', badge: 'bg-[#EAE4D3] text-[#4A3C31]' },
    EXAM: { dot: 'bg-[#A44A3F]', bg: 'bg-[#F2EFE9]', border: 'border-[#D4CBB8]', text: 'text-[#A44A3F]', badge: 'bg-[#EBDDD5] text-[#A44A3F]' },
    GLOBAL: { dot: 'bg-[#41A36D]', bg: 'bg-[#F2EFE9]', border: 'border-[#D4CBB8]', text: 'text-[#41A36D]', badge: 'bg-[#DDEBDB] text-[#41A36D]' },
    FEST: { dot: 'bg-[#8E54E5]', bg: 'bg-[#F2EFE9]', border: 'border-[#D4CBB8]', text: 'text-[#8E54E5]', badge: 'bg-[#E9DFFA] text-[#8E54E5]' },
    CUSTOM: { dot: 'bg-[#F98825]', bg: 'bg-[#F2EFE9]', border: 'border-[#D4CBB8]', text: 'text-[#F98825]', badge: 'bg-[#FCE3CF] text-[#F98825]' },
};

export default function WebCalendar() {
    const [events, setEvents] = useState<WebEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [isAdding, setIsAdding] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isSavingCustom, setIsSavingCustom] = useState(false);

    const fetchEvents = useCallback(async () => {
        const token = localStorage.getItem('calendrify_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync/web-events`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setEvents(data.events || []);
        } catch (e) {
            console.error('Failed to fetch web events');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const removeEvent = async (mappingId: string) => {
        const token = localStorage.getItem('calendrify_token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync/web-events/${mappingId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setEvents(prev => prev.filter(e => e.mappingId !== mappingId));
        } catch (e) {
            console.error('Failed to remove event');
        }
    };

    const handleSaveCustom = async () => {
        if (!customTitle || !selectedDate) return;
        setIsSavingCustom(true);
        const token = localStorage.getItem('calendrify_token');
        // DD/MM/YYYY format mapping our parseDateStr expectation
        let dStr = selectedDate.toLocaleDateString('en-GB');
        if (dStr.includes('-')) {
            const parts = dStr.split('-');
            dStr = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync/custom-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: customTitle, date: dStr, start: customStart, end: customEnd })
            });
            if (res.ok) {
                await fetchEvents();
                setIsAdding(false);
                setCustomTitle('');
                setCustomStart('');
                setCustomEnd('');
            }
        } catch (e) {
            console.error('Failed to save custom event');
        }
        setIsSavingCustom(false);
    };

    // Get events for a specific date
    const getEventsForDate = (date: Date): WebEvent[] => {
        const dayName = DAY_NAMES[date.getDay()];
        const result: WebEvent[] = [];
        const dateString = date.toDateString();

        // 1. Identify what specific events land on this date
        const dateSpecificEvents: WebEvent[] = [];
        for (const ev of events) {
            if (['EXAM', 'GLOBAL', 'CUSTOM'].includes(ev.type) && ev.time.date) {
                const evDate = parseDateStr(ev.time.date);
                if (evDate && evDate.toDateString() === dateString) {
                    dateSpecificEvents.push(ev);
                }
            }
        }

        // Add them to result
        result.push(...dateSpecificEvents);

        // 2. Check if classes should be suspended today
        const hasSuspension = dateSpecificEvents.some(e => e.type === 'GLOBAL' || e.type === 'EXAM');
        const classStart = new Date(2026, 0, 2); // 2 Jan 2026
        const classEnd = new Date(2026, 3, 24); // 24 Apr 2026
        const isWithinTerm = date >= classStart && date <= classEnd;

        // 3. Add classes if the university is open and terms are active
        if (!hasSuspension && isWithinTerm && date.getDay() !== 0) {
            for (const ev of events) {
                if (ev.type === 'CLASS' && ev.time.dayOfWeek === dayName) {
                    result.push(ev);
                }
            }
        }

        return result.sort((a, b) => {
            const ha = parseHour(a.time.start || '');
            const hb = parseHour(b.time.start || '');
            return ha - hb;
        });
    };

    // Calendar grid generation
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = Array(firstDay).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
        week.push(new Date(year, month, d));
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }
    if (week.length > 0) {
        while (week.length < 7) week.push(null);
        weeks.push(week);
    }

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
    const goToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()); };

    const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-6xl mb-4"></p>
                <h3 className="text-xl font-serif font-bold text-[#5E3A21] text-[#5E3A21] mb-2">Your Web Calendar is empty</h3>
                <p className="text-[#8C5E45]">Select events below and click &quot;Save to Web Calendar&quot; to populate it.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-2 hover:bg-[#EAE4D3] rounded-lg transition text-[#8C5E45] text-lg">◀</button>
                <div className="text-center">
                    <h3 className="text-xl font-serif font-bold text-[#5E3A21] text-[#5E3A21]">{MONTH_NAMES[month]} {year}</h3>
                    <button onClick={goToday} className="text-xs text-[#8C4A32] hover:underline mt-0.5">Today</button>
                </div>
                <button onClick={nextMonth} className="p-2 hover:bg-[#EAE4D3] rounded-lg transition text-[#8C5E45] text-lg">▶</button>
            </div>

            {/* Calendar Grid */}
            <div className="border border-[#D0C5AE] rounded-xl overflow-hidden shadow-sm">
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-[#F6F5ED]">
                    {DAY_NAMES.map(d => (
                        <div key={d} className={`py-2 text-center text-xs font-bold uppercase tracking-wider ${d === 'Sun' ? 'text-[#A44A3F]' : 'text-[#8C5E45]'}`}>{d}</div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 border-t border-[#EAE4D3]">
                        {week.map((date, di) => {
                            if (!date) return <div key={di} className="h-20 bg-[#F6F5ED]"></div>;

                            const isToday = date.toDateString() === today.toDateString();
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            const dayEvents = getEventsForDate(date);
                            const isSunday = date.getDay() === 0;
                            const globalEvents = dayEvents.filter(e => e.type === 'GLOBAL');
                            const midsems = globalEvents.filter(e => e.title.includes('Mid-Semester') || e.title.includes('Mid Sem'));
                            const fests = globalEvents.filter(e => e.title.includes('MOKSHA') || e.title.includes('Sports Meet'));
                            const holidays = globalEvents.filter(e => !e.title.includes('Mid-Semester') && !e.title.includes('Mid Sem') && !e.title.includes('MOKSHA') && !e.title.includes('Sports Meet'));

                            const hasClass = dayEvents.some(e => e.type === 'CLASS');
                            const hasExam = dayEvents.some(e => e.type === 'EXAM') || midsems.length > 0;
                            const hasHoliday = holidays.length > 0;
                            const hasFest = fests.length > 0;
                            const hasCustom = dayEvents.some(e => e.type === 'CUSTOM');

                            return (
                                <button
                                    key={di}
                                    onClick={() => setSelectedDate(date)}
                                    className={`h-20 p-1.5 text-left transition relative border-l border-[#EAE4D3] first:border-l-0 hover:bg-[#EAE4D3]/50 ${isSelected ? 'bg-[#EAE4D3] ring-2 ring-inset ring-[#8C4A32]' : ''
                                        } ${isSunday ? 'bg-[#F2EFE9]/30' : ''}`}
                                >
                                    <span className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-[#8C4A32] text-white' : isSunday ? 'text-[#A44A3F]' : 'text-[#5E3A21]'
                                        }`}>
                                        {date.getDate()}
                                    </span>

                                    {/* Event dots */}
                                    <div className="flex gap-0.5 mt-1 flex-wrap">
                                        {hasClass && <span className="w-1.5 h-1.5 rounded-full bg-[#4A3C31]"></span>}
                                        {hasExam && <span className="w-1.5 h-1.5 rounded-full bg-[#A44A3F]"></span>}
                                        {hasFest && <span className="w-1.5 h-1.5 rounded-full bg-[#8E54E5]"></span>}
                                        {hasHoliday && <span className="w-1.5 h-1.5 rounded-full bg-[#41A36D]"></span>}
                                        {hasCustom && <span className="w-1.5 h-1.5 rounded-full bg-[#F98825]"></span>}
                                    </div>

                                    {/* Event labels */}
                                    {hasFest && (
                                        <p className="text-[9px] font-semibold text-[#8E54E5] truncate mt-0.5 leading-tight">
                                            {fests[0]?.title}
                                        </p>
                                    )}
                                    {hasHoliday && !hasFest && (
                                        <p className="text-[9px] font-semibold text-[#41A36D] truncate mt-0.5 leading-tight">
                                            {holidays[0]?.title}
                                        </p>
                                    )}

                                    {/* Class count badge */}
                                    {hasClass && !hasHoliday && !hasFest && !hasExam && (
                                        <p className="text-[9px] text-[#4A3C31] font-medium mt-0.5">
                                            {dayEvents.filter(e => e.type === 'CLASS').length} class{dayEvents.filter(e => e.type === 'CLASS').length > 1 ? 'es' : ''}
                                        </p>
                                    )}

                                    {/* Exam label */}
                                    {hasExam && !hasFest && (
                                        <p className="text-[9px] font-semibold text-[#A44A3F] truncate mt-0.5"> Exam</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 flex-wrap text-xs text-[#8C5E45]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A3C31]"></span> Classes</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#A44A3F]"></span> Exams</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#41A36D]"></span> Holidays</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F98825]"></span> Personal</span>
            </div>

            {/* Selected Day Detail Panel */}
            {selectedDate && (
                <div className="bg-[#FCFBFA] border border-[#D0C5AE] rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-[#A0522D] px-5 py-3 flex items-center justify-between">
                        <h4 className="text-white font-bold text-sm">
                            {DAY_NAMES[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                        </h4>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsAdding(!isAdding)} className="text-white/80 hover:text-white bg-[#FCFBFA]/10 hover:bg-[#FCFBFA]/20 px-2 py-1 rounded text-xs font-semibold transition">{isAdding ? 'Cancel' : '+ Add Event'}</button>
                            <button onClick={() => { setSelectedDate(null); setIsAdding(false); }} className="text-white/70 hover:text-white text-lg transition">✕</button>
                        </div>
                    </div>

                    {isAdding && (
                        <div className="p-4 bg-[#F2EFE9] border-b border-orange-100 flex flex-col gap-3">
                            <input autoFocus type="text" placeholder="Event Title (e.g. Study Group)" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#D4CBB8] rounded-lg outline-none focus:ring-2 focus:ring-orange-400 bg-[#FCFBFA]" />
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-[#F98825] block mb-1">Start Time (Opt)</label>
                                    <input type="time" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#D4CBB8] rounded-lg outline-none focus:ring-2 focus:ring-orange-400 bg-[#FCFBFA] text-[#5E3A21]" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-[#F98825] block mb-1">End Time (Opt)</label>
                                    <input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#D4CBB8] rounded-lg outline-none focus:ring-2 focus:ring-orange-400 bg-[#FCFBFA] text-[#5E3A21]" />
                                </div>
                            </div>
                            <button disabled={!customTitle || isSavingCustom} onClick={handleSaveCustom} className="w-full py-2 bg-[#F98825] hover:bg-orange-600 active:scale-95 transition text-white font-bold rounded-lg text-sm disabled:opacity-50 disabled:scale-100">
                                {isSavingCustom ? 'Saving...' : 'Save Custom Event'}
                            </button>
                        </div>
                    )}

                    {selectedEvents.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <p className="text-[#8C5E45] text-sm">{selectedDate.getDay() === 0 ? ' Sunday — No classes!' : 'No events on this day.'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {selectedEvents.map(ev => {
                                let typeKey = ev.type as string;
                                let label = typeKey === 'CLASS' ? 'CLASS' : typeKey === 'EXAM' ? 'EXAM' : typeKey === 'CUSTOM' ? 'PERSONAL' : 'HOLIDAY';

                                if (typeKey === 'GLOBAL') {
                                    if (ev.title.includes('Mid-Semester') || ev.title.includes('Mid Sem')) {
                                        typeKey = 'EXAM';
                                        label = 'EXAM';
                                    } else if (ev.title.includes('MOKSHA') || ev.title.includes('Sports Meet')) {
                                        typeKey = 'FEST';
                                        label = 'FEST';
                                    }
                                }

                                const c = TYPE_COLORS[typeKey as keyof typeof TYPE_COLORS] || TYPE_COLORS.GLOBAL;

                                return (
                                    <div key={ev.mappingId || ev._id} className={`flex items-start gap-3 px-5 py-3 ${c.bg} hover:brightness-95 transition group`}>
                                        {/* Time column */}
                                        <div className="w-20 flex-shrink-0 pt-0.5">
                                            {ev.time.start ? (
                                                <div>
                                                    <p className={`text-xs font-bold ${c.text}`}>{formatTime12(ev.time.start)}</p>
                                                    {ev.time.end && <p className="text-[10px] text-[#8C5E45]">{formatTime12(ev.time.end)}</p>}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[#8C5E45]">All day</p>
                                            )}
                                        </div>

                                        {/* Decorative bar */}
                                        <div className={`w-1 rounded-full self-stretch ${c.dot}`}></div>

                                        {/* Event info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.badge}`}>
                                                    {label}
                                                </span>
                                                {ev.subjectCode && <span className="text-[10px] text-[#8C5E45] font-mono">{ev.subjectCode}</span>}
                                            </div>
                                            <p className={`font-semibold text-sm mt-0.5 ${c.text}`}>{ev.title}</p>
                                            <div className="flex flex-wrap gap-x-3 gap-y-0 mt-1 text-[11px] text-[#8C5E45]">
                                                {ev.room && <span> {ev.room}</span>}
                                                {ev.faculty && <span> {ev.faculty}</span>}
                                            </div>
                                        </div>

                                        {/* Remove button */}
                                        <button
                                            onClick={() => removeEvent(ev.mappingId)}
                                            className="text-[#8C5E45] hover:text-[#A44A3F] opacity-0 group-hover:opacity-100 transition text-sm font-bold self-center"
                                        >✕</button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Stats */}
            <p className="text-xs text-[#8C5E45] text-center">
                {events.filter(e => e.type === 'CLASS').length} classes · {events.filter(e => e.type === 'EXAM').length} exams · {events.filter(e => e.type === 'GLOBAL').length} holidays saved
            </p>
        </div>
    );
}
