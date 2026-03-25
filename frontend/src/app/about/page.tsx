import Link from 'next/link';
import Image from 'next/image';
import InstallPWAButton from '../../components/InstallPWAButton';

export default function AboutPage() {
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-8 bg-[#F6F5ED] text-[#5E3A21]">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 md:px-8 flex justify-between items-center z-50">
                <div className="text-2xl font-bold font-serif text-[#8C4A32] tracking-tight">
                    <a href="/">Calendrify</a>
                </div>
                <div className="flex items-center gap-4">
                    <InstallPWAButton />
                    <a href="/about" className="font-semibold text-[#8C5E45] hover:text-[#6E3A27] transition-colors text-lg">About</a>
                </div>
            </div>

            <div className="max-w-3xl w-full bg-[#FCFBFA] p-10 md:p-12 rounded-2xl shadow-sm border border-[#D0C5AE] flex flex-col gap-8 z-10 my-20">
                <div className="text-center">
                    <h1 className="text-5xl font-serif font-bold text-[#8C4A32] mb-4">About Calendrify</h1>
                </div>

                <section>
                    <h2 className="text-2xl font-bold text-[#8C5E45] mb-4 border-b border-[#EAE4D3] pb-2">Core Philosophy</h2>
                    <p className="leading-relaxed text-lg text-[#5E3A21]">
                        Calendrify is built with a simple premise: managing academic schedules should not be tedious.
                        Students juggle multiple classes, labs, and exams, and organizing them efficiently is the key to
                        a productive semester. Our core philosophy is to automate the mundane scheduling process
                        by providing an intuitive, seamless integration of your academic timetable directly into a modern dashboard and your Google Calendar.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-[#8C5E45] mb-4 border-b border-[#EAE4D3] pb-2">About the Creator</h2>
                    <p className="leading-relaxed text-lg text-[#5E3A21] mb-6">
                        Calendrify was built by <strong>Aryan Anand</strong>. It was born out of personal frustration with poorly formatted college schedules.
                        By leveraging modern web technologies, AI tools, and a user-centric design approach, Aryan developed this application to help
                        fellow students reclaim their time and focus on what truly matters: their education and personal growth.
                    </p>
                    <div className="flex justify-center">
                        <a
                            href="https://www.linkedin.com/in/aryan-anand-4aba06309/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block py-4 px-8 bg-[#8C4A32] text-white rounded-xl shadow-md hover:bg-[#6E3A27] transition-all font-bold text-lg hover:-translate-y-1 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            Connect on LinkedIn
                        </a>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:px-8 flex justify-between items-center text-sm text-[#8C5E45] z-50">
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
