'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            localStorage.setItem('calendrify_token', token);
            router.push('/dashboard');
        } else {
            router.push('/?error=no_token');
        }
    }, [token, router]);

    return (
        <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Authenticating...</h2>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
    );
}

export default function AuthSuccess() {
    return (
        <div className="flex min-h-screen items-center justify-center p-24 bg-gray-50">
            <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
                <SuccessHandler />
            </Suspense>
        </div>
    );
}
