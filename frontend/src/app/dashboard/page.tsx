'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import WebCalendar from './WebCalendar';
import InstallPWAButton from '../../components/InstallPWAButton';

const DEGREES = [
    "B.Tech.",
    "M.Tech (FULL TIME)",
    "B.Tech.(Lateral)",
    "BBA (HONOURS)",
    "MASTER OF ARTS"
];

const BRANCHES = [
    { "branchName": "VLSI DESIGN AND TECHNOLOGY", "shortName": "VSLI" },
    { "branchName": "ELECTRONICS AND COMMUNICATION ENGINEERING (INTERNET OF THINGS)", "shortName": "EIOT" },
    { "branchName": "ELECTRONICS AND COMMUNICATION ENGINEERING", "shortName": "ECE" },
    { "branchName": "ELECTRICAL ENGINEERING", "shortName": "EE" },
    { "branchName": "COMPUTER SCIENCE AND ENGINEERING (INTERNET OF THINGS)", "shortName": "CSEIOT" },
    { "branchName": "MECHANICAL ENGINEERING (ELECTRIC VEHICLES)", "shortName": "ME(EV)" },
    { "branchName": "CIVIL ENGINEERING", "shortName": "CIVIL" },
    { "branchName": "COMPUTER SCIENCE AND ENGINEERING", "shortName": "CSE" },
    { "branchName": "INFORMATION TECHNOLOGY", "shortName": "IT" },
    { "branchName": "MATHEMATICS AND COMPUTING", "shortName": "MAC" },
    { "branchName": "BACHELOR OF ARCHITECTURE", "shortName": "B ARCH" },
    { "branchName": "INFORMATION TECHNOLOGY (NETWORK AND INFORMATION SECURITY)", "shortName": "ITNS" },
    { "branchName": "COMPUTER SCIENCE AND ENGINEERING (BIG DATA ANALYTICS)", "shortName": "CSE(DA)" },
    { "branchName": "COMPUTER SCIENCE AND ENGINEERING (ARTIFICIAL INTELLIGENCE)", "shortName": "CSAI" },
    { "branchName": "GEOINFORMATICS", "shortName": "GEOINFORMATICS" },
    { "branchName": "COMPUTER SCIENCE AND ENGINEERING (DATA SCIENCE)", "shortName": "CSDS" },
    { "branchName": "INSTRUMENTATION AND CONTROL ENGINEERING", "shortName": "ICE" },
    { "branchName": "ELECTRONICS AND COMMUNICATION ENGINEERING (ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING)", "shortName": "ECE(AI)" },
    { "branchName": "BIO TECHNOLOGY", "shortName": "BT" },
    { "branchName": "MECHANICAL ENGINEERING", "shortName": "ME" }
].sort((a, b) => a.branchName.localeCompare(b.branchName));

const CustomSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: { label: string, value: string }[], placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
                className={`w-full p-3 border rounded-xl outline-none text-left shadow-sm transition flex justify-between items-center ${isOpen ? 'border-[#8C4A32] ring-2 ring-[#8C4A32]/20 bg-[#FCFBFA]' : 'border-[#D0C5AE] hover:border-[#8C4A32] bg-[#FCFBFA]'
                    }`}
            >
                <span className={value ? 'text-[#5E3A21] font-medium truncate pr-4' : 'text-gray-400'}>
                    {value ? options.find(o => o.value === value)?.label || value : placeholder}
                </span>
                <svg className={`w-4 h-4 flex-shrink-0 text-[#8C5E45] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute z-50 w-full mt-1 bg-[#FCFBFA] border border-[#D0C5AE] rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 ring-1 ring-black/5">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#EAE4D3] transition ${value === opt.value ? 'bg-[#EAE4D3] text-[#8C4A32] font-bold' : 'text-[#5E3A21]'}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        degree: '',
        specialization: '',
        semester: '',
        section: ''
    });
    const [syncPreview, setSyncPreview] = useState<any>(null);
    const [loadingSync, setLoadingSync] = useState(false);
    const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
    const [syncMode, setSyncMode] = useState<'web' | 'gcal'>('web');
    const [webCalKey, setWebCalKey] = useState(0);
    // per-event reminder: Map<eventId, minutes | null>
    const [eventReminders, setEventReminders] = useState<Map<string, number | null>>(new Map());
    const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());

    const REMINDER_OPTIONS = [
        { label: '5 min before', value: 5 },
        { label: '10 min before', value: 10 },
        { label: '30 min before', value: 30 },
        { label: '1 hr before', value: 60 },
        { label: '2 hrs before', value: 120 },
        { label: '1 day before', value: 1440 },
    ];

    const toggleReminder = (id: string) => {
        const next = new Map(eventReminders);
        if (next.has(id)) next.delete(id); // toggle off
        else next.set(id, 10); // default 10 min
        setEventReminders(next);
    };

    const setReminderFor = (id: string, minutes: number) => {
        setEventReminders(prev => new Map(prev).set(id, minutes));
    };

    const toggleEvent = (id: string) => {
        const next = new Set(selectedEventIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedEventIds(next);
    };

    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('calendrify_token');
        if (!token) return router.push('/');

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    setFormData({
                        degree: data.user.profile?.degree || '',
                        specialization: data.user.profile?.specialization || '',
                        semester: data.user.profile?.semester || '',
                        section: data.user.profile?.section || ''
                    });

                    // Force profile editing if critical info missing
                    if (!data.user.profile?.degree || !data.user.profile?.specialization) {
                        setIsEditing(true);
                    }
                }
            })
            .catch(() => router.push('/'));
    }, [router]);

    const handleSaveProfile = async () => {
        const token = localStorage.getItem('calendrify_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            setUser(data.user);
            setIsEditing(false);
            setSyncPreview(null);
        } catch (error) {
            console.error('Failed to update profile');
        }
    };

    const handlePreviewSync = async () => {
        setLoadingSync(true);
        const token = localStorage.getItem('calendrify_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync/preview`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setSyncPreview(data);
            if (data.events) {
                setSelectedEventIds(new Set(data.events.map((e: any) => e._id)));
            }
        } catch (error) {
            console.error('Failed to get preview');
        }
        setLoadingSync(false);
    };

    const executeSyncFor = async (type: 'CLASS' | 'EXAM' | 'GLOBAL' | 'ALL') => {
        if (!syncPreview?.events) return;
        const idsForType = syncPreview.events
            .filter((e: any) => (type === 'ALL' || e.type === type) && selectedEventIds.has(e._id))
            .map((e: any) => e._id);
        if (idsForType.length === 0) return alert('No checked events in this category to inject.');
        setLoadingCategory(type);
        const token = localStorage.getItem('calendrify_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync/execute`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedEventIds: idsForType,
                    eventReminders: Object.fromEntries(
                        [...eventReminders.entries()].filter(([id]) => idsForType.includes(id))
                    )
                })
            });
            const data = await res.json();
            alert(data.message || data.error);
        } catch (error) {
            console.error('Sync failed');
        }
        setLoadingCategory(null);
    };

    const saveToWebCalendar = async (type: 'CLASS' | 'EXAM' | 'GLOBAL' | 'ALL') => {
        if (!syncPreview?.events) return;
        const idsForType = syncPreview.events
            .filter((e: any) => (type === 'ALL' || e.type === type) && selectedEventIds.has(e._id))
            .map((e: any) => e._id);
        if (idsForType.length === 0) return alert('No events selected for this category.');
        setLoadingCategory(type);
        const token = localStorage.getItem('calendrify_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sync/web-save`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedEventIds: idsForType })
            });
            const data = await res.json();
            alert(data.message || data.error);
            setWebCalKey(k => k + 1); // refresh calendar
        } catch (error) {
            console.error('Web save failed');
        }
        setLoadingCategory(null);
    };

    if (!user) return <div className="flex h-screen items-center justify-center bg-[#F6F5ED]"><div className="w-10 h-10 border-4 border-[#82442A] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <main className="min-h-screen bg-[#F6F5ED] pt-20 sm:pt-28 pb-20 sm:pb-24 px-3 sm:px-4 relative font-sans text-[#3B2516]">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full px-4 py-3 sm:p-6 md:px-8 flex justify-between items-center z-50">
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#8C4A32] tracking-tight">
                    <a href="/">Calendrify</a>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => { localStorage.removeItem('calendrify_token'); router.push('/'); }} className="font-semibold text-[#8C5E45] hover:text-[#6E3A27] transition-colors text-sm sm:text-lg">Log Out</button>
                    <a href="/about" className="font-semibold text-[#8C5E45] hover:text-[#6E3A27] transition-colors text-sm sm:text-lg">About</a>
                    <InstallPWAButton />
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-[#FBFBFA] p-4 sm:p-8 rounded-2xl shadow-sm border border-[#E0D8C3] z-10 relative">
                <h1 className="text-2xl sm:text-4xl font-serif font-bold mb-4 sm:mb-8 text-[#5A2C1A] tracking-tight">Welcome, {user.name || user.email}</h1>

                <div className="bg-[#EAE4D3] border border-[#D0C5AE] p-4 sm:p-8 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start z-10 relative gap-3">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#5A2C1A] mb-1 sm:mb-2">Student Profile</h2>
                            <p className="text-[#6D493B] mb-3 sm:mb-6 text-sm sm:text-base">Set up your academic details to see your synced college calendar events.</p>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-shrink-0 px-3 py-2 sm:px-5 sm:py-2.5 bg-[#8C4A32] text-white font-medium rounded-xl shadow-sm hover:bg-[#6E3A27] transition active:scale-95 text-sm sm:text-base">
                            Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 z-10 relative">
                        <div className="bg-[#FCFBFA]/60 p-4 rounded-xl">
                            <label className="block text-xs font-semibold text-[#5E3A21] uppercase tracking-wider">Degree</label>
                            <p className="mt-1 text-[#5E3A21] font-medium">{user.profile?.degree || 'Not set'}</p>
                        </div>
                        <div className="bg-[#FCFBFA]/60 p-4 rounded-xl">
                            <label className="block text-xs font-semibold text-[#5E3A21] uppercase tracking-wider">Branch</label>
                            <p className="mt-1 text-[#5E3A21] font-medium truncate" title={user.profile?.specialization}>{user.profile?.specialization || 'Not set'}</p>
                        </div>
                        <div className="bg-[#FCFBFA]/60 p-4 rounded-xl">
                            <label className="block text-xs font-semibold text-[#5E3A21] uppercase tracking-wider">Semester</label>
                            <p className="mt-1 text-[#5E3A21] font-medium">{user.profile?.semester || 'Not set'}</p>
                        </div>
                        <div className="bg-[#FCFBFA]/60 p-4 rounded-xl">
                            <label className="block text-xs font-semibold text-[#5E3A21] uppercase tracking-wider">Section</label>
                            <p className="mt-1 text-[#5E3A21] font-medium">{user.profile?.section || 'Not set'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-10 border-t border-[#EAE4D3]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#5E3A21]">Event Synchronization</h2>
                        <div className="flex bg-[#EAE4D3] rounded-xl p-1 self-start sm:self-auto">
                            <button
                                onClick={() => setSyncMode('web')}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${syncMode === 'web' ? 'bg-[#FCFBFA] shadow text-[#8C4A32]' : 'text-[#8C5E45] hover:text-[#5E3A21]'}`}
                            >Web Calendar</button>
                            <button
                                onClick={() => setSyncMode('gcal')}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${syncMode === 'gcal' ? 'bg-[#FCFBFA] shadow text-[#8C4A32]' : 'text-[#8C5E45] hover:text-[#5E3A21]'}`}
                            >Google Calendar</button>
                        </div>
                    </div>

                    {syncMode === 'web' && (
                        <div className="mb-8 p-6 bg-[#FCFBFA] border border-[#D0C5AE] rounded-2xl shadow-sm">
                            <h3 className="text-2xl font-serif font-bold text-[#5E3A21] mb-6">Your Academic Web Calendar</h3>
                            <WebCalendar key={webCalKey} />
                        </div>
                    )}

                    {syncMode === 'web' ? (
                        <div className="bg-[#EAE4D3] border border-[#D0C5AE] px-4 py-3 rounded-xl text-sm text-[#8C4A32] mb-4">
                            <strong> Web Calendar Mode:</strong> Select events below and save them — they&apos;ll appear in your calendar above.
                        </div>
                    ) : null}

                    <div className={syncMode === 'web' ? 'mt-8 pt-6 border-t border-[#D0C5AE]' : ''}>
                        <div className="bg-[#F6F5ED] border border-[#D0C5AE] p-6 rounded-2xl text-center">
                            {user.profile?.specialization && user.profile?.section && user.profile?.degree && user.profile?.semester ? (
                                <div className="flex flex-col items-center gap-4">
                                    <button
                                        onClick={handlePreviewSync}
                                        className="px-6 py-3 bg-[#8C4A32] text-white font-semibold rounded-full shadow hover:bg-[#6E3A27] transition active:scale-95 flex items-center justify-center gap-2 mx-auto"
                                    >
                                        {loadingSync ? 'Loading...' : 'Check Available Classes'}
                                    </button>

                                    {syncPreview && syncPreview.events && syncPreview.counts && (
                                        <div className="mt-6 text-left w-full bg-[#FCFBFA] p-6 rounded-xl border border-[#D0C5AE] shadow-sm">
                                            <h3 className="font-semibold text-lg mb-4 text-[#5E3A21]">✓ Found exactly {syncPreview.counts.total} events mapping to your precise combination!</h3>

                                            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                                                <div className="bg-blue-50 border border-[#D0C5AE] p-4 rounded-xl text-center">
                                                    <p className="text-4xl font-serif font-bold text-[#5E3A21] text-[#8C4A32]">{syncPreview.counts.classes}</p>
                                                    <p className="text-sm font-medium text-[#5E3A21]">Classes</p>
                                                </div>
                                                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                                                    <p className="text-4xl font-serif font-bold text-[#5E3A21] text-[#5E3A21]">{syncPreview.counts.exams}</p>
                                                    <p className="text-sm font-medium text-[#5E3A21]">Final Exams</p>
                                                </div>
                                                <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                                                    <p className="text-4xl font-serif font-bold text-[#5E3A21] text-[#5E3A21]">{syncPreview.counts.holidays}</p>
                                                    <p className="text-sm font-medium text-[#5E3A21]">Global Holidays</p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-[#8C5E45] mb-6 italic">Note: Classes automatically end in June. Holidays are auto-skipped for classes on the specific dates!</p>
                                            <p className="text-md font-bold text-[#5E3A21] mb-4 pb-2 border-b border-[#D0C5AE]">Select the events to inject into your Calendar:</p>

                                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 mb-6">
                                                {syncPreview.events.filter((e: any) => e.type === 'CLASS').length > 0 && (() => {
                                                    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                                    const classes = syncPreview.events.filter((e: any) => e.type === 'CLASS');
                                                    const grouped: Record<string, any[]> = {};
                                                    classes.forEach((ev: any) => {
                                                        const day = ev.time?.dayOfWeek || 'Unknown';
                                                        if (!grouped[day]) grouped[day] = [];
                                                        grouped[day].push(ev);
                                                    });
                                                    const orderedDays = dayOrder.filter(d => grouped[d]);
                                                    return (
                                                        <div>
                                                            <h4 className="font-bold text-[#5E3A21] mb-3 bg-blue-50/50 p-2 rounded">Weekly Classes</h4>
                                                            {orderedDays.map(day => (
                                                                <div key={day} className="mb-4">
                                                                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#8C5E45] mb-2 pl-1">{day}</p>
                                                                    {grouped[day].sort((a: any, b: any) => (a.time?.start || '').localeCompare(b.time?.start || '')).map((ev: any) => (
                                                                        <div key={ev._id} className="flex flex-col mb-2">
                                                                            <label className="flex items-start gap-3 p-3 bg-[#FCFBFA] border border-[#D0C5AE] rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-sm transition">
                                                                                <input type="checkbox" checked={selectedEventIds.has(ev._id)} onChange={() => toggleEvent(ev._id)} className="mt-1 w-4 h-4 text-[#8C4A32] rounded cursor-pointer" />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="font-bold text-[#5E3A21] text-sm">{ev.title}</p>
                                                                                    <p className="text-xs text-[#8C5E45]">{ev.time?.start} - {ev.time?.end} | Room: {ev.room}</p>
                                                                                </div>
                                                                                {syncMode === 'gcal' && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={e => { e.preventDefault(); toggleReminder(ev._id); }}
                                                                                        className={`text-xs font-semibold px-2 py-1 rounded-lg border transition whitespace-nowrap ${eventReminders.has(ev._id) ? 'bg-amber-100 border-amber-400 text-[#5E3A21]' : 'border-gray-300 text-[#8C5E45] hover:border-amber-400 hover:text-[#5E3A21]'}`}
                                                                                    > {eventReminders.has(ev._id) ? 'Reminder set' : 'Reminder'}</button>
                                                                                )}
                                                                            </label>
                                                                            {syncMode === 'gcal' && eventReminders.has(ev._id) && (
                                                                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 border-t-0 rounded-b-lg text-xs">
                                                                                    <span className="text-[#5E3A21] font-medium"> Notify:</span>
                                                                                    <select value={eventReminders.get(ev._id) ?? 10} onChange={e => setReminderFor(ev._id, parseInt(e.target.value))} className="border border-amber-300 rounded px-2 py-0.5 bg-[#FCFBFA] text-xs focus:ring-1 focus:ring-amber-400 outline-none">
                                                                                        {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                                                    </select>
                                                                                    <span className="text-[#5E3A21] italic">· will be injected with this reminder</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}

                                                {syncPreview.events.filter((e: any) => e.type === 'EXAM').length > 0 && (
                                                    <div>
                                                        <h4 className="font-bold text-[#5E3A21] mb-3 bg-red-50/50 p-2 rounded mt-4">Final Exams</h4>
                                                        {syncPreview.events.filter((e: any) => e.type === 'EXAM').map((ev: any) => (
                                                            <div key={ev._id} className="flex flex-col mb-2">
                                                                <label className="flex items-start gap-3 p-3 bg-[#FCFBFA] border border-[#D0C5AE] rounded-lg cursor-pointer hover:border-red-300 hover:shadow-sm transition">
                                                                    <input type="checkbox" checked={selectedEventIds.has(ev._id)} onChange={() => toggleEvent(ev._id)} className="mt-1 w-4 h-4 text-[#5E3A21] rounded cursor-pointer" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-[#5E3A21] text-sm">{ev.title}</p>
                                                                        <p className="text-xs text-[#8C5E45]">Date: {ev.time?.date} • {ev.time?.start} - {ev.time?.end}</p>
                                                                    </div>
                                                                    {syncMode === 'gcal' && (
                                                                        <button type="button" onClick={e => { e.preventDefault(); toggleReminder(ev._id); }} className={`text-xs font-semibold px-2 py-1 rounded-lg border transition whitespace-nowrap ${eventReminders.has(ev._id) ? 'bg-amber-100 border-amber-400 text-[#5E3A21]' : 'border-gray-300 text-[#8C5E45] hover:border-amber-400 hover:text-[#5E3A21]'}`}> {eventReminders.has(ev._id) ? 'Reminder set' : 'Reminder'}</button>
                                                                    )}
                                                                </label>
                                                                {syncMode === 'gcal' && eventReminders.has(ev._id) && (
                                                                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 border-t-0 rounded-b-lg text-xs">
                                                                        <span className="text-[#5E3A21] font-medium"> Notify:</span>
                                                                        <select value={eventReminders.get(ev._id) ?? 10} onChange={e => setReminderFor(ev._id, parseInt(e.target.value))} className="border border-amber-300 rounded px-2 py-0.5 bg-[#FCFBFA] text-xs focus:ring-1 focus:ring-amber-400 outline-none">
                                                                            {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                                        </select>
                                                                        <span className="text-[#5E3A21] italic">· will be injected with this reminder</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {(() => {
                                                    const globals = syncPreview.events.filter((e: any) => e.type === 'GLOBAL');
                                                    if (globals.length === 0) return null;

                                                    const getCat = (t: string) => {
                                                        const l = t.toLowerCase();
                                                        if (l.includes('mid-semester') || l.includes('mid sem')) return { key: 'midsem', label: 'Mid-Semester Examinations', pfx: '[Exam]', color: 'red' };
                                                        if (l.includes('moksha') || l.includes('sports meet')) return { key: 'fest', label: 'University Fests & Events', pfx: '[Fest]', color: 'purple' };
                                                        return { key: 'holiday', label: 'Global Holidays', pfx: '[Holiday]', color: 'green' };
                                                    };

                                                    // Group them
                                                    const grouped: Record<string, { cat: any, events: any[] }> = {};
                                                    for (const ev of globals) {
                                                        const cat = getCat(ev.title);
                                                        if (!grouped[cat.key]) grouped[cat.key] = { cat, events: [] };
                                                        grouped[cat.key].events.push(ev);
                                                    }

                                                    return Object.values(grouped).map(({ cat, events }) => (
                                                        <div key={cat.key}>
                                                            <h4 className={`font-bold text-${cat.color}-800 mb-3 bg-${cat.color}-50/50 p-2 rounded mt-4`}>{cat.label}</h4>
                                                            {events.map((ev: any) => (
                                                                <div key={ev._id} className="flex flex-col mb-2">
                                                                    <label className={`flex items-start gap-3 p-3 bg-[#FCFBFA] border border-[#D0C5AE] rounded-lg cursor-pointer hover:border-${cat.color}-300 hover:shadow-sm transition`}>
                                                                        <input type="checkbox" checked={selectedEventIds.has(ev._id)} onChange={() => toggleEvent(ev._id)} className={`mt-1 w-4 h-4 text-${cat.color}-600 rounded cursor-pointer`} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-bold text-[#5E3A21] text-sm">{ev.title}</p>
                                                                            <p className="text-xs text-[#8C5E45]">Date: {ev.time?.date}</p>
                                                                        </div>
                                                                        {syncMode === 'gcal' && (
                                                                            <button type="button" onClick={e => { e.preventDefault(); toggleReminder(ev._id); }} className={`text-xs font-semibold px-2 py-1 rounded-lg border transition whitespace-nowrap ${eventReminders.has(ev._id) ? 'bg-amber-100 border-amber-400 text-[#5E3A21]' : 'border-gray-300 text-[#8C5E45] hover:border-amber-400 hover:text-[#5E3A21]'}`}> {eventReminders.has(ev._id) ? 'Reminder set' : 'Reminder'}</button>
                                                                        )}
                                                                    </label>
                                                                    {syncMode === 'gcal' && eventReminders.has(ev._id) && (
                                                                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 border-t-0 rounded-b-lg text-xs">
                                                                            <span className="text-[#5E3A21] font-medium"> Notify:</span>
                                                                            <select value={eventReminders.get(ev._id) ?? 10} onChange={e => setReminderFor(ev._id, parseInt(e.target.value))} className="border border-amber-300 rounded px-2 py-0.5 bg-[#FCFBFA] text-xs focus:ring-1 focus:ring-amber-400 outline-none">
                                                                                {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                                            </select>
                                                                            <span className="text-[#5E3A21] italic">· will be injected with this reminder</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>

                                            {(() => {
                                                const action = syncMode === 'gcal' ? executeSyncFor : saveToWebCalendar;
                                                const isCalendarLinked = user?.calendarLinked || !!user?.tokens?.refreshToken;

                                                if (syncMode === 'gcal' && !isCalendarLinked) {
                                                    return (
                                                        <div className="bg-[#EAE4D3] p-8 rounded-xl border border-[#D0C5AE] text-center mt-4">
                                                            <h4 className="text-xl font-serif text-[#8C4A32] font-bold mb-3">Google Calendar Locked</h4>
                                                            <p className="text-[#8C5E45] mb-6">You need to grant Calendar permissions to inject these exams and classes directly into your Google Calendar.</p>
                                                            <button
                                                                onClick={async () => {
                                                                    const token = localStorage.getItem('calendrify_token');
                                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/sync-url?guestToken=${token}`);
                                                                    const data = await res.json();
                                                                    if (data.url) window.location.href = data.url;
                                                                }}
                                                                className="px-8 py-4 bg-[#8C4A32] text-white font-bold rounded-xl shadow hover:bg-[#6E3A27] transition hover:scale-105 active:scale-95"
                                                            >
                                                                Connect Google Calendar
                                                            </button>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="flex flex-col gap-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <button
                                                                onClick={() => action('CLASS')}
                                                                disabled={loadingCategory !== null}
                                                                className={`px-4 py-3 font-bold rounded-xl shadow transition text-sm flex flex-col items-center gap-1 ${loadingCategory === null ? 'bg-[#8C4A32] text-white hover:bg-[#6E3A27] active:scale-95' : 'bg-[#EAE4D3] text-[#8C5E45] cursor-not-allowed'}`}
                                                            >
                                                                {loadingCategory === 'CLASS' ? 'Injecting...' : 'Inject Classes'}
                                                            </button>
                                                            <button
                                                                onClick={() => action('EXAM')}
                                                                disabled={loadingCategory !== null}
                                                                className={`px-4 py-3 font-bold rounded-xl shadow transition text-sm flex flex-col items-center gap-1 ${loadingCategory === null ? 'bg-[#8C4A32] text-white hover:bg-[#6E3A27] active:scale-95' : 'bg-[#EAE4D3] text-[#8C5E45] cursor-not-allowed'}`}
                                                            >
                                                                {loadingCategory === 'EXAM' ? 'Injecting...' : 'Inject Exams'}
                                                            </button>
                                                            <button
                                                                onClick={() => action('GLOBAL')}
                                                                disabled={loadingCategory !== null}
                                                                className={`px-4 py-3 font-bold rounded-xl shadow transition text-sm flex flex-col items-center gap-1 ${loadingCategory === null ? 'bg-[#8C4A32] text-white hover:bg-[#6E3A27] active:scale-95' : 'bg-[#EAE4D3] text-[#8C5E45] cursor-not-allowed'}`}
                                                            >
                                                                {loadingCategory === 'GLOBAL' ? 'Injecting...' : 'Inject Holidays'}
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => action('ALL')}
                                                            disabled={loadingCategory !== null}
                                                            className={`w-full px-6 py-4 font-bold rounded-xl shadow transition text-xl font-serif flex justify-center items-center gap-2 ${loadingCategory === null ? 'bg-[#5E3A21] text-[#F6F5ED] hover:bg-[#4A2D1A] active:scale-95' : 'bg-[#EAE4D3] text-[#8C5E45] cursor-not-allowed'}`}
                                                        >
                                                            {loadingCategory === 'ALL' ? 'Injecting...' : 'Inject All Events'}
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    {syncPreview && syncPreview.error && (
                                        <p className="text-[#8C5E45] mt-4">{syncPreview.error}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-[#8C5E45]">Please click &quot;Edit Profile&quot; above and type your exact academic info to enable syncing.</p>
                            )}
                        </div>
                    </div>


                </div>

                {isEditing && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#FCFBFA] p-8 rounded-2xl max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-serif font-bold text-[#5E3A21] mb-6 text-[#5E3A21]">Edit Profile</h2>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#5E3A21] mb-1">Degree</label>
                                    <CustomSelect
                                        value={formData.degree}
                                        onChange={val => setFormData({ ...formData, degree: val })}
                                        options={DEGREES.map(d => ({ label: d, value: d }))}
                                        placeholder="Select your degree"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#5E3A21] mb-1">Branch</label>
                                    <CustomSelect
                                        value={formData.specialization}
                                        onChange={val => setFormData({ ...formData, specialization: val })}
                                        options={BRANCHES.map(b => ({ label: b.branchName, value: b.branchName }))}
                                        placeholder="Select your branch"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#5E3A21] mb-1">Semester (e.g. 2)</label>
                                    <input type="text" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-xl focus:ring-2 focus:ring-[#8C4A32] outline-none bg-[#FCFBFA] text-[#5E3A21] font-medium shadow-sm transition hover:border-[#8C4A32] placeholder-gray-400" placeholder="Enter your current semester" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#5E3A21] mb-1">Section (e.g. 2)</label>
                                    <input type="text" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-xl focus:ring-2 focus:ring-[#8C4A32] outline-none bg-[#FCFBFA] text-[#5E3A21] font-medium shadow-sm transition hover:border-[#8C4A32] placeholder-gray-400" placeholder="Enter your current section" />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                {user?.profile?.degree && user?.profile?.specialization && (
                                    <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-[#5E3A21] hover:bg-[#EAE4D3] rounded-xl transition">Cancel</button>
                                )}
                                <button onClick={handleSaveProfile} className="px-5 py-2.5 bg-[#8C4A32] text-white rounded-xl shadow-sm hover:bg-[#6E3A27] transition">Save Changes</button>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full px-4 py-3 sm:p-6 md:px-8 flex justify-between items-center text-xs sm:text-sm text-[#8C5E45] z-50">
                <div className="font-medium">&copy; {new Date().getFullYear()} Calendrify</div>
                <div className="font-medium flex items-center gap-2">
                    Made by <a href="https://www.linkedin.com/in/aryan-anand-4aba06309/" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-[#8C4A32] flex items-center gap-1">
                        Aryan Anand
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                    </a>
                </div>
            </div>
        </main>
    );
}
