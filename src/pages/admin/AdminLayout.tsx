
import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    BarChart2,
    Users,
    FileText,
    AlertTriangle,
    Zap,
    Menu,
    LogOut,
    X,
    ArrowLeft,
    Settings,
    Sun,
    Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';

interface SidebarItemProps {
    icon: any;
    label: string;
    path: string;
    active: boolean;
    onClick: () => void;
    badge?: string;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: SidebarItemProps) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
    >
        <div className="flex items-center gap-3">
            <Icon size={20} className={active ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
            <span className="font-medium">{label}</span>
        </div>
        {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${active
                ? 'bg-blue-500 text-white'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {badge}
            </span>
        )}
    </button>
);

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, isAuthenticated, logout } = useAuth();

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Live activity counter
    const [activityCount, setActivityCount] = useState(0);
    const [recentEvents, setRecentEvents] = useState<{ type: string; title: string; time: Date }[]>([]);

    // Socket for admin layout (shared connection for live counter)
    const { socket, connected } = useSocket({
        authToken: token,
        enabled: isAuthenticated && !!token,
        autoJoin: [{ event: 'join_admin_room', payload: token }],
    });

    useEffect(() => {
        if (!socket) return;

        const handleAnyEvent = (data: any, eventType: string) => {
            setActivityCount(prev => prev + 1);
            setRecentEvents(prev => [
                { type: eventType, title: data.title || data.content?.slice(0, 30) || 'Activity', time: new Date() },
                ...prev.slice(0, 4),
            ]);

            // Auto-clear counter after 30 seconds
            setTimeout(() => setActivityCount(prev => Math.max(0, prev - 1)), 30000);
        };

        const onNewQ = (data: any) => handleAnyEvent(data, 'question');
        const onNewA = (data: any) => handleAnyEvent(data, 'answer');

        socket.on('admin_new_question', onNewQ);
        socket.on('admin_new_answer', onNewA);

        return () => {
            socket.off('admin_new_question', onNewQ);
            socket.off('admin_new_answer', onNewA);
        };
    }, [socket]);

    const isActive = (path: string) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        return location.pathname.startsWith(path) && path !== '/admin';
    };

    return (
        <div className="relative flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 w-full max-w-full overflow-x-hidden">
            {/* Mobile Header Toggle */}
            <div className="sticky top-0 z-20 h-14 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 md:hidden flex items-center justify-between px-4 shrink-0 shadow-sm w-full">
                <span className="font-bold text-gray-800 dark:text-white">Admin Panel</span>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -mr-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar + Main Content Wrapper */}
            <div className="flex w-full min-h-screen">

                <aside className={`
                    fixed top-0 left-0 z-40
                    h-screen w-64 shrink-0
                    bg-white dark:bg-slate-800
                    border-r border-gray-200 dark:border-slate-700
                    flex flex-col
                    transform transition-transform duration-300
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                            `}>
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700 hidden md:block">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Admin Panel
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage everything</p>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        <SidebarItem
                            icon={BarChart2}
                            label="Overview"
                            path="/admin"
                            active={location.pathname === '/admin'}
                            onClick={() => navigate('/admin')}
                        />
                        <SidebarItem
                            icon={Users}
                            label="User Management"
                            path="/admin/users"
                            active={isActive('/admin/users')}
                            onClick={() => navigate('/admin/users')}
                        />
                        <SidebarItem
                            icon={FileText}
                            label="Content Moderation"
                            path="/admin/moderation"
                            active={isActive('/admin/moderation')}
                            onClick={() => navigate('/admin/moderation')}
                            badge={activityCount > 0 ? activityCount.toString() : undefined}
                        />
                        <SidebarItem
                            icon={AlertTriangle}
                            label="Reports"
                            path="/admin/reports"
                            active={isActive('/admin/reports')}
                            onClick={() => navigate('/admin/reports')}
                        />
                        <SidebarItem
                            icon={Settings}
                            label="Platform Settings"
                            path="/admin/settings"
                            active={isActive('/admin/settings')}
                            onClick={() => navigate('/admin/settings')}
                        />
                    </nav>

                    {/* Sidebar Footer Actions */}
                    <div className="border-t border-gray-200 dark:border-slate-700 p-4">
                        <Link
                            to="/"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 bg-primary text-white rounded-xl transition-colors font-medium text-sm hover:bg-primary/90 shadow-sm"
                        >
                            <ArrowLeft size={16} /> Back to App
                        </Link>

                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={16} className={connected ? 'text-green-500' : 'text-gray-400'} />
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Live Activity
                            </span>
                            {connected && (
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                        </div>

                        {recentEvents.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-4">No recent events</p>
                        ) : (
                            <div className="space-y-2 mb-4">
                                {recentEvents.map((ev, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs animate-fade-in-up">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.type === 'question' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                        <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{ev.title}</span>
                                        <span className="text-gray-400 shrink-0">{ev.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors font-medium text-sm md:hidden"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content Container (has its own flex-col so it can hold the top bar and content) */}
                <div className="flex-1 flex flex-col min-w-0 min-h-screen relative md:ml-64">
                    {/* Desktop Top Nav (Only md and up) */}
                    <div className="hidden md:flex sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 items-center justify-end px-8 shrink-0">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    const newMode = !document.documentElement.classList.contains('dark');
                                    localStorage.setItem('darkMode', JSON.stringify(newMode));
                                    if (newMode) document.documentElement.classList.add('dark');
                                    else document.documentElement.classList.remove('dark');
                                    // Trigger a re-render hack by updating body class
                                    document.body.className = document.body.className;
                                }}
                                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                {document.documentElement.classList.contains('dark') ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>
                    </div>

                    <main id="admin-main-content" className="flex-1 p-4 md:p-8 w-full min-w-0">
                        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>

        </div>
    );
};

export default AdminLayout;
