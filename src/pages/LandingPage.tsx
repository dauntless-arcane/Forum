import React, { useState, useEffect } from 'react';
import { Rocket, Lock } from 'lucide-react';

interface LandingPageProps {
    launchDate: string;
}

function calculateTimeLeft(targetD: string) {
    if (!targetD) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const target = new Date(targetD).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}

const LandingPage: React.FC<LandingPageProps> = ({ launchDate }) => {
    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(launchDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(launchDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [launchDate]);

    // Formatting utility
    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 md:p-14 rounded-3xl shadow-2xl text-center max-w-2xl w-full mx-auto">
                <div className="mx-auto w-20 h-20 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <Rocket size={40} className="animate-bounce" />
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
                    Launching Soon
                </h1>
                <p className="text-lg md:text-xl text-slate-400 mb-12">
                    We are currently putting the final touches on Recalibrate. Get ready for an entirely new experience.
                </p>

                {/* Countdown Timer */}
                {launchDate ? (
                    <div className="flex justify-center gap-4 md:gap-8">
                        <div className="flex flex-col items-center">
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 w-20 h-24 md:w-28 md:h-32 rounded-2xl flex items-center justify-center shadow-inner pt-2">
                                <span className="text-4xl md:text-6xl font-bold text-white font-mono tracking-tighter">
                                    {formatNumber(timeLeft.days)}
                                </span>
                            </div>
                            <span className="text-slate-500 font-semibold mt-3 uppercase tracking-wider text-xs md:text-sm">Days</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 w-20 h-24 md:w-28 md:h-32 rounded-2xl flex items-center justify-center shadow-inner pt-2">
                                <span className="text-4xl md:text-6xl font-bold text-white font-mono tracking-tighter">
                                    {formatNumber(timeLeft.hours)}
                                </span>
                            </div>
                            <span className="text-slate-500 font-semibold mt-3 uppercase tracking-wider text-xs md:text-sm">Hours</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 w-20 h-24 md:w-28 md:h-32 rounded-2xl flex items-center justify-center shadow-inner pt-2">
                                <span className="text-4xl md:text-6xl font-bold text-white font-mono tracking-tighter">
                                    {formatNumber(timeLeft.minutes)}
                                </span>
                            </div>
                            <span className="text-slate-500 font-semibold mt-3 uppercase tracking-wider text-xs md:text-sm">Minutes</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 w-20 h-24 md:w-28 md:h-32 rounded-2xl flex items-center justify-center shadow-inner pt-2 z-10 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                                <span className="text-4xl md:text-6xl font-bold text-blue-400 font-mono tracking-tighter mix-blend-screen relative z-10 transition-all duration-300">
                                    {formatNumber(timeLeft.seconds)}
                                </span>
                            </div>
                            <span className="text-slate-500 font-semibold mt-3 uppercase tracking-wider text-xs md:text-sm">Seconds</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center flex-col items-center p-6 border border-slate-700/50 bg-slate-900/50 rounded-xl">
                        <span className="text-2xl font-bold text-white animate-pulse">Awaiting Signal...</span>
                    </div>
                )}
            </div>

            {/* Footer Text */}
            <div className="absolute bottom-4 md:bottom-8 w-full flex flex-col items-center justify-center text-slate-500 text-sm z-10 gap-2">
                <p>&copy; {new Date().getFullYear()} Recalibrate. All rights reserved.</p>
                {/* <div className="flex items-center gap-1 text-xs text-slate-600 opacity-60 hover:opacity-100 transition-opacity cursor-help" title="Admins: Append ?token=YOUR_TOKEN to the URL to bypass this screen">
                    <Lock size={12} />
                    <span>Admin Portal Access</span> 
            </div> */}
            </div>
        </div >
    );
};

export default LandingPage;
