'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    degree: '',
    department: '',
    specialization: '',
    semester: '',
    section: ''
  });

  const DEPARTMENTS = [
    "INSTRUMENTATION AND CONTROL ENGINEERING",
    "COMPUTER SCIENCE AND ENGINEERING",
    "CIVIL ENGINEERING",
    "INFORMATION TECHNOLOGY",
    "MECHANICAL ENGINEERING",
    "ELECTRONICS AND COMMUNICATION ENGINEERING",
    "MECHANICAL ENGINEERING(WEST)",
    "GEOINFORMATICS",
    "COMPUTER SCIENCE AND ENGINEERING(EAST)",
    "ELECTRICAL ENGINEERING",
    "BIOLOGICAL SCIENCES AND ENGINEERING",
    "MANAGEMENT STUDIES",
    "HUMANITIES AND SOCIAL SCIENCES",
    "ELECTRONICS AND COMMUNICATION ENGINEERING(EAST)"
  ];

  const DEGREES = [
    "B.Tech.",
    "M.Tech (FULL TIME)",
    "B.Tech.(Lateral)",
    "BBA (HONOURS)",
    "MASTER OF ARTS"
  ];

  const SPECIALIZATIONS = [
    'COMPUTER SCIENCE AND ENGINEERING',
    'COMPUTER SCIENCE AND ENGINEERING (ARTIFICIAL INTELLIGENCE)',
    'COMPUTER SCIENCE AND ENGINEERING (BIG DATA ANALYTICS)',
    'COMPUTER SCIENCE AND ENGINEERING (DATA SCIENCE)',
    'COMPUTER SCIENCE AND ENGINEERING (INTERNET OF THINGS)',
    'ELECTRONICS AND COMMUNICATION ENGINEERING',
    'ELECTRONICS AND COMMUNICATION ENGINEERING (ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING)',
    'ELECTRONICS ENGINEERING (VLSI DESIGN AND TECHNOLOGY)',
    'ELECTRICAL ENGINEERING',
    'INSTRUMENTATION AND CONTROL ENGINEERING',
    'CIVIL ENGINEERING',
    'MECHANICAL ENGINEERING',
    'MECHANICAL ENGINEERING (ELECTRIC VEHICLES)',
    'INFORMATION TECHNOLOGY',
    'INFORMATION TECHNOLOGY (NETWORK AND INFORMATION SECURITY)',
    'MATHEMATICS AND COMPUTING',
    'GEOINFORMATICS',
    'BIO TECHNOLOGY',
    'BACHELOR OF BUSINESS ADMINISTRATION (HONOURS)',
    'APPLIED PSYCHOLOGY',
    'VLSI DESIGN AND TECHNOLOGY',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('calendrify_token', data.token);
        router.push('/dashboard');
      } else {
        alert('Failed to start session');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#F6F5ED] text-[#5E3A21]">
      <div className="z-10 max-w-lg w-full flex flex-col gap-8 bg-[#FCFBFA] p-10 rounded-2xl shadow-sm border border-[#D0C5AE]">
        <div className="text-center">
          <h1 className="text-5xl font-serif font-bold text-[#8C4A32] mb-3">
            Calendrify
          </h1>
          <p className="text-[#8C5E45] text-lg">
            Set up your profile to generate your academic schedule.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-[#5E3A21] mb-1">Degree</label>
            <select required value={formData.degree} onChange={e => setFormData({ ...formData, degree: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-lg bg-white text-[#5E3A21] focus:ring-2 focus:ring-[#8C4A32] outline-none">
              <option value="" disabled>Select your degree</option>
              {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#5E3A21] mb-1">Department</label>
            <select required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-lg bg-white text-[#5E3A21] focus:ring-2 focus:ring-[#8C4A32] outline-none">
              <option value="" disabled>Select your department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#5E3A21] mb-1">Specialization / Program</label>
            <select required value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-lg bg-white text-[#5E3A21] focus:ring-2 focus:ring-[#8C4A32] outline-none">
              <option value="" disabled>Select your program</option>
              {SPECIALIZATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#5E3A21] mb-1">Semester</label>
              <input required type="text" placeholder="e.g. 2" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-lg bg-white text-[#5E3A21] focus:ring-2 focus:ring-[#8C4A32] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#5E3A21] mb-1">Section</label>
              <input required type="text" placeholder="e.g. 2" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-lg bg-white text-[#5E3A21] focus:ring-2 focus:ring-[#8C4A32] outline-none" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-4 w-full py-4 text-lg font-bold bg-[#8C4A32] text-white rounded-xl shadow hover:bg-[#6E3A27] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Generating Schedule...' : 'View My Schedule'}
          </button>

          <p className="text-center text-xs text-[#8C5E45] mt-2">
            You can link a Google Calendar account inside the dashboard later to export events.
          </p>
        </form>
      </div>
    </main>
  );
}
