
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    BarChart2,
    Users,
    FileText,
    AlertTriangle
} from 'lucide-react';

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

    // Simple helper to check active path
    const isActive = (path: string) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        return location.pathname.startsWith(path) && path !== '/admin';
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
            {/* Sidebar - Desktop */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
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
                    />
                    <SidebarItem
                        icon={AlertTriangle}
                        label="Reports"
                        path="/admin/reports"
                        active={isActive('/admin/reports')}
                        onClick={() => navigate('/admin/reports')}
                    />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
