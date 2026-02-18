
import { useState, useEffect } from 'react';
import {
    Users,
    FileText,
    AlertTriangle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { admin, users as userApi } from '../../services/api';
import UserTable from '../../components/admin/UserTable';
import { useNavigate } from 'react-router-dom';

const AdminOverview = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { title: 'Total Users', value: '0', change: '0%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
        { title: 'Total Posts', value: '0', change: '0%', icon: FileText, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20' },
        { title: 'Pending Reports', value: '0', change: '0%', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/20' },
        { title: 'Specialists', value: '0', change: '0%', icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    ]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch System Stats
                let systemStats = {
                    totalUsers: 0,
                    specialistsCount: 0,
                    pendingReports: 0,
                    newPosts: 0
                };

                try {
                    const { data } = await admin.getStats();
                    if (data) systemStats = data;
                } catch (error) {
                    console.error("Failed to fetch system stats", error);
                }

                // Fetch recent users (limit 5)
                let usersList = [];
                try {
                    const { data } = await userApi.getAll({ limit: 5 });
                    usersList = data.users || [];
                    setRecentUsers(usersList.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                        status: u.banned ? 'Suspended' : (u.verified ? 'Active' : 'Pending'),
                        joined: new Date(u.createdAt || Date.now()).toLocaleDateString()
                    })));
                } catch (e) {
                    console.error("Failed to fetch recent users", e);
                }

                // Update Stats Display
                setStats([
                    { title: 'Total Users', value: systemStats.totalUsers.toString(), change: '+0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
                    { title: 'Total Posts', value: systemStats.newPosts.toString(), change: '+0', icon: FileText, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20' },
                    { title: 'Pending Reports', value: systemStats.pendingReports.toString(), change: '+0', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/20' },
                    { title: 'Specialists', value: systemStats.specialistsCount.toString(), change: '+0', icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/20' },
                ]);

            } catch (error) {
                console.error("Dashboard error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // These actions might not be fully functional in Overview if we want to force users to the Users page
    // but preserving basic functionality is good.
    const handleBanUser = async (userId: string, _name?: string) => {
        if (!confirm(`Are you sure you want to ban user ${_name || userId}?`)) return;
        try {
            await admin.banUser(userId);
            alert("User banned successfully.");
            setRecentUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Suspended' } : u));
        } catch (e) {
            console.error(e);
            alert("Failed to ban user.");
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            await admin.approveUser(userId);
            setRecentUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Active' } : u));
            alert("User approved successfully.");
        } catch (e) {
            console.error(e);
            alert("Failed to approve user.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white capitalize">
                        Dashboard Overview
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Welcome back, Admin.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-slate-700 group"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.title}</h3>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</span>
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${stat.change.startsWith('+') ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Users</h3>
                    <button onClick={() => navigate('/admin/users')} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline">
                        View All
                    </button>
                </div>
                <UserTable users={recentUsers} onBan={handleBanUser} onApprove={handleApprove} />
            </div>
        </>
    );
};

export default AdminOverview;
