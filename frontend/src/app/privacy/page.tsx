import InstallPWAButton from '../../components/InstallPWAButton';

export default function PrivacyPolicy() {
    const lastUpdated = 'March 30, 2025';
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-[#F6F5ED] text-[#5E3A21]">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full px-4 py-4 sm:p-6 md:px-8 flex justify-between items-center z-50">
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#8C4A32] tracking-tight">
                    <a href="/">Calendrify</a>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <a href="/about" className="font-semibold text-[#8C5E45] hover:text-[#6E3A27] transition-colors text-sm sm:text-lg">About</a>
                    <InstallPWAButton />
                </div>
            </div>

            <div className="max-w-3xl w-full bg-[#FCFBFA] px-6 py-8 sm:p-10 md:p-12 rounded-2xl shadow-sm border border-[#D0C5AE] flex flex-col gap-6 z-10 my-20 mx-4">
                <div className="text-center border-b border-[#EAE4D3] pb-6">
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#8C4A32] mb-2">Privacy Policy</h1>
                    <p className="text-[#8C5E45] text-sm">Last updated: {lastUpdated}</p>
                </div>

                <section className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-[#8C5E45] border-b border-[#EAE4D3] pb-2">1. Overview</h2>
                    <p className="leading-relaxed text-[#5E3A21]">
                        Calendrify (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;) is an academic scheduling tool that helps students
                        sync their college timetables with Google Calendar. This Privacy Policy explains what information
                        we collect, how we use it, and the choices you have.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-[#8C5E45] border-b border-[#EAE4D3] pb-2">2. Information We Collect</h2>
                    <p className="leading-relaxed text-[#5E3A21]">When you sign in with Google, we collect:</p>
                    <ul className="list-disc list-inside text-[#5E3A21] space-y-1 ml-2">
                        <li><strong>Google Account Name and Email Address</strong> — used to identify your account.</li>
                        <li><strong>Google OAuth Tokens</strong> — used only to add events to your Google Calendar when you explicitly request it. Refresh tokens are stored securely and used exclusively for calendar synchronization.</li>
                    </ul>
                    <p className="leading-relaxed text-[#5E3A21] mt-2">We also store the academic profile information you provide (degree, branch, semester, section) to generate your personalized timetable.</p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-[#8C5E45] border-b border-[#EAE4D3] pb-2">3. How We Use Your Information</h2>
                    <ul className="list-disc list-inside text-[#5E3A21] space-y-1 ml-2">
                        <li>To authenticate you and maintain your session.</li>
                        <li>To retrieve and display your academic timetable events.</li>
                        <li>To add academic events (classes, exams, holidays) to your Google Calendar — only when you explicitly click &quot;Inject&quot;.</li>
                        <li>We do <strong>not</strong> read, modify, or delete any existing events from your Google Calendar.</li>
                    </ul>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-[#8C5E45] border-b border-[#EAE4D3] pb-2">4. Google API Scopes Used</h2>
                    <p className="leading-relaxed text-[#5E3A21]">Calendrify requests the following Google OAuth scopes:</p>
                    <ul className="list-disc list-inside text-[#5E3A21] space-y-1 ml-2 font-mono text-sm">
                        <li>userinfo.profile — to get your name</li>
                        <li>userinfo.email — to identify your account</li>
                        <li>https://www.googleapis.com/auth/calendar — to create events in your Google Calendar (requested only when you choose to sync)</li>
                    </ul>
                    <p className="leading-relaxed text-[#5E3A21] mt-2">
                        Our use of Google user data complies with the{' '}
                        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#8C4A32] font-semibold underline hover:text-[#6E3A27]">
                            Google API Services User Data Policy
                        </a>, including the Limited Use requirements.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-[#8C5E45] border-b border-[#EAE4D3] pb-2">5. Data Storage and Security</h2>
                    <ul className="list-disc list-inside text-[#5E3A21] space-y-1 ml-2">
                        <li>All data is stored in a secured MongoDB database.</li>
                        <li>OAuth tokens are stored encrypted and are never shared with third parties.</li>
                        <li>We do not sell or share your personal information with advertisers or third parties.</li>
                    </ul>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-[#8C5E45] border-b border-[#EAE4D3] pb-2">6. Data Retention and Deletion</h2>
                    <p className="leading-relaxed text-[#5E3A21]">
                        Your data is retained as long as you use Calendrify. You may request account deletion at any time
                        by contacting us at the email below. Upon deletion, all your personal data including OAuth tokens
                        will be permanently removed.
                    </p>
                </section>

                <section className="flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-[#8C5E45] border-b border-[#EAE4D3] pb-2">7. Contact</h2>
                    <p className="leading-relaxed text-[#5E3A21]">
                        If you have any questions about this Privacy Policy, please contact:
                        <br />
                        <a href="https://www.linkedin.com/in/aryan-anand-4aba06309/" target="_blank" rel="noopener noreferrer" className="text-[#8C4A32] font-semibold underline hover:text-[#6E3A27]">
                            Aryan Anand — LinkedIn
                        </a>
                    </p>
                </section>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full px-4 py-4 sm:p-6 md:px-8 flex justify-between items-center text-xs sm:text-sm text-[#8C5E45] z-50">
                <div className="font-medium">&copy; {new Date().getFullYear()} Calendrify</div>
                <div className="font-medium flex items-center gap-2">
                    <a href="/privacy" className="hover:text-[#8C4A32] transition-colors">Privacy Policy</a>
                </div>
            </div>
        </main>
    );
}
