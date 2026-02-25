import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const OnboardingTour: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Only run if the user is logged in
        if (isAuthenticated && user) {
            const hasCompletedTour = localStorage.getItem(`tour_completed_${user.id}`) === 'true';

            if (!hasCompletedTour && location.pathname === '/') {
                // give it a tiny delay to allow DOM render
                setTimeout(() => setRun(true), 1500);
            }
        }
    }, [isAuthenticated, user, location.pathname]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            if (user) {
                // Store as a persistent variable that the presentation has been done
                localStorage.setItem(`tour_completed_${user.id}`, 'true');
            }
        }
    };

    const isMobile = window.innerWidth < 768;
    const targetPrefix = isMobile ? '.tour-mobile-' : '.tour-desktop-';

    const baseSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div className="text-center p-2 text-white">
                    <h2 className="text-2xl font-bold mb-2">Let's take a quick tour</h2>
                    <p className="text-slate-300 font-medium mb-4">It's going to take just a few seconds to show you the features.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
            locale: { next: 'Take a tour', skip: 'Skip this short & sweet tour' }
        },
        {
            target: `${targetPrefix}explore`,
            content: (
                <div className="text-left text-white">
                    <h3 className="font-bold mb-1">Explore Questions</h3>
                    <p className="text-slate-300 text-sm">Here you can explore all the public questions asked by the community.</p>
                </div>
            ),
            placement: 'bottom',
            disableBeacon: true,
            disableOverlayClose: true,
        },
        {
            target: '.tour-search',
            content: (
                <div className="text-left text-white">
                    <h3 className="font-bold mb-1">Globally Search</h3>
                    <p className="text-slate-300 text-sm">Use this powerful search to quickly hunt down specific topics or experts.</p>
                </div>
            ),
            placement: 'bottom',
            disableBeacon: true,
            disableOverlayClose: true,
        },
        {
            target: '.tour-filters',
            content: (
                <div className="text-left text-white">
                    <h3 className="font-bold mb-1">Advanced Filters</h3>
                    <p className="text-slate-300 text-sm">Filter out the noise by applying granular tags like Psychology or Industry.</p>
                </div>
            ),
            placement: 'bottom',
            disableBeacon: true,
            disableOverlayClose: true,
        },
        {
            target: `${targetPrefix}ask`,
            content: (
                <div className="text-left text-white">
                    <h3 className="font-bold mb-1">Ask the Community</h3>
                    <p className="text-slate-300 text-sm">Click here whenever you want to ask a brand new question!</p>
                </div>
            ),
            placement: 'bottom',
            disableBeacon: true,
            disableOverlayClose: true,
        }
    ];

    // Conditionally Add Specialized Navigation elements
    if (user?.role === 'specialist') {
        baseSteps.push({
            target: `${targetPrefix}panel`,
            content: (
                <div className="text-left text-white">
                    <h3 className="font-bold mb-1">Specialist Panel</h3>
                    <p className="text-slate-300 text-sm">This is your exclusive workspace. Review pending questions routed to your expertise, deliver high-quality answers, track your performance, and manage your specialist profile.</p>
                </div>
            ),
            placement: 'bottom',
            disableBeacon: true,
            disableOverlayClose: true,
        });

        // Specialists don't have profile or dashboard on mobile, so we add the final steps directly
    } else if (user?.role === 'admin') {
        baseSteps.push(
            {
                target: `${targetPrefix}dashboard`,
                content: (
                    <div className="text-left text-white">
                        <h3 className="font-bold mb-1">Personal Dashboard</h3>
                        <p className="text-slate-300 text-sm">Your Dashboard tracks questions you have asked personally.</p>
                    </div>
                ),
                placement: 'bottom',
                disableBeacon: true,
                disableOverlayClose: true,
            },
            {
                target: `${targetPrefix}admin`,
                content: (
                    <div className="text-left text-white">
                        <h3 className="font-bold mb-1">Admin Operations Center</h3>
                        <p className="text-slate-300 text-sm">Access user moderation, approve new specialists, and resolve community reports.</p>
                    </div>
                ),
                placement: 'bottom',
                disableBeacon: true,
                disableOverlayClose: true,
            },
            {
                target: `${targetPrefix}profile`,
                content: (
                    <div className="text-left text-white">
                        <h3 className="font-bold mb-1">Your Profile</h3>
                        <p className="text-slate-300 text-sm">Click here to update your profile details and toggle Dark Mode settings.</p>
                    </div>
                ),
                placement: 'left',
                disableBeacon: true,
                disableOverlayClose: true,
            }
        );
    } else {
        // Normal User
        baseSteps.push({
            target: `${targetPrefix}dashboard`,
            content: (
                <div className="text-left text-white">
                    <h3 className="font-bold mb-1">Personal Dashboard</h3>
                    <p className="text-slate-300 text-sm">Your Dashboard is your command center. Track questions you've asked, monitor requested answers, view your total upvotes, and see a complete summary of your activity across the platform.</p>
                </div>
            ),
            placement: 'bottom',
            disableBeacon: true,
            disableOverlayClose: true,
        });
    }

    // Always Finish with Announcements
    baseSteps.push(
        {
            target: 'body',
            content: (
                <div className="text-left text-white">
                    <h2 className="text-lg font-bold text-red-400 mb-2">Platform Rules & Bans ⚠️</h2>
                    <p className="text-slate-300 text-sm">
                        Recalibrate is a professional environment. Any inappropriate behavior, spam, hate speech, or harassment is strictly monitored by our Admins. <b>Violation of these rules will result in a permanent ban.</b> Be respectful!
                    </p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
            locale: { next: 'Finish Tour' }
        }
    );

    const steps = baseSteps;

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            run={run}
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={steps}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#3b82f6', // Tailwind blue-500
                    textColor: '#f8fafc',
                    arrowColor: '#1e293b', // Tailwind slate-800
                    backgroundColor: '#1e293b', // Tailwind slate-800
                    overlayColor: 'rgba(0, 0, 0, 0.75)',
                },
                tooltip: {
                    borderRadius: '12px',
                    padding: '20px',
                },
                buttonNext: {
                    backgroundColor: '#333333',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontWeight: 600,
                },
                buttonBack: {
                    color: '#94a3b8',
                },
                buttonSkip: {
                    color: '#94a3b8',
                }
            }}
        />
    );
};

export default OnboardingTour;
