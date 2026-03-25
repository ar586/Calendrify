'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallPWAButton from '../../components/InstallPWAButton';

export default function Login() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('calendrify_token', data.token);
                router.push('/dashboard');
            } else {
                alert(data.error || 'Login failed');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-[#F6F5ED] text-[#5E3A21]">
            <div className="absolute top-0 left-0 w-full p-6 md:px-8 flex justify-between items-center z-50">
                <div className="text-2xl font-bold font-serif text-[#8C4A32] tracking-tight">
                    <a href="/">Calendrify</a>
                </div>
                <div className="flex items-center gap-4">
                    <a href="/about" className="font-semibold text-[#8C5E45] hover:text-[#6E3A27] transition-colors text-lg">About</a>
                    <InstallPWAButton />
                </div>
            </div>

            <div className="z-10 max-w-sm w-full flex flex-col gap-6 bg-[#FCFBFA] p-8 rounded-2xl shadow-sm border border-[#D0C5AE]">
                <div className="text-center">
                    <h1 className="text-4xl font-serif font-bold text-[#8C4A32] mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-[#8C5E45]">
                        Log in to access your Web Calendar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-bold text-[#5E3A21] mb-1">Email</label>
                        <input required type="email" placeholder="student@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-lg bg-white text-[#5E3A21] focus:ring-2 focus:ring-[#8C4A32] outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#5E3A21] mb-1">Password</label>
                        <input required type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-3 border border-[#D0C5AE] rounded-lg bg-white text-[#5E3A21] focus:ring-2 focus:ring-[#8C4A32] outline-none" />
                    </div>

                    <button type="submit" disabled={loading} className="mt-2 w-full py-3 text-lg font-bold bg-[#8C4A32] text-white rounded-xl shadow hover:bg-[#6E3A27] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-[#D0C5AE]"></div>
                        <span className="flex-shrink-0 mx-4 text-[#8C5E45] text-sm font-bold">OR</span>
                        <div className="flex-grow border-t border-[#D0C5AE]"></div>
                    </div>

                    <button type="button" onClick={async () => {
                        const res = await fetch('http://localhost:5000/api/auth/google/url');
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                    }} className="w-full py-3 text-lg font-bold bg-white text-[#5E3A21] border border-[#D0C5AE] rounded-xl shadow-sm hover:bg-gray-50 transition-all flex justify-center items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="text-center text-xs text-[#8C5E45] mt-2">
                        Don't have an account? <a href="/" className="font-bold hover:underline">Register here</a>.
                    </p>
                </form>
            </div>
        </main>
    );
}
