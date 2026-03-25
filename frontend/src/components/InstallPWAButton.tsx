'use client';

import { useState, useEffect } from 'react';

export default function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert("To install Calendrify, you can select 'Add to Home Screen' from your browser's Share menu (Safari/iOS) or Settings menu (Chrome/Android). It may also already be installed!");
            return;
        }
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        // We've used the prompt, and can't use it again, throw it away
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    return (
        <button
            onClick={handleInstallClick}
            className="font-semibold text-white bg-[#8C5E45] hover:bg-[#6E3A27] transition-colors text-sm px-4 py-1.5 rounded-full shadow-sm"
        >
            Install App
        </button>
    );
}
