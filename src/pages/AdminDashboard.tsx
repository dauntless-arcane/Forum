import { useState, useEffect } from 'react';
import {
    Users,
    FileText,
    AlertTriangle,
    Settings,
    MoreVertical,
    CheckCircle,
    BarChart2,
    Activity,
    Loader2,
    Upload,
    Trash
} from 'lucide-react';
import io from 'socket.io-client';
import { admin, users as userApi } from '../services/api';
import { User, Question, Answer, Report } from '../types';

interface UserRow {
    id: string;
    name: string;
    role: string;
    status: string;
    joined: string;
    email?: string;
    password?: string;
}

type FeedItem = {
    id: string;
    type: 'question' | 'answer';
    timestamp?: string | Date;
    createdAt?: string;
    userId?: User | { name: string; id: string } | string;
    title?: string;
    description?: string;
    content?: string;
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { title: 'Total Users', value: '0', change: '0%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
        { title: 'New Posts', value: '0', change: '0%', icon: FileText, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20' },
        { title: 'Pending Reports', value: '0', change: '0%', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/20' },
        { title: 'Specialists', value: '0', change: '0%', icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    ]);
    const [recentUsers, setRecentUsers] = useState<UserRow[]>([]);
    const [reportsCount, setReportsCount] = useState(0);
    const [reports, setReports] = useState<Report[]>([]);
    const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
    const [createdUsers, setCreatedUsers] = useState<Partial<User>[]>([]);
    const [contentFeed, setContentFeed] = useState<FeedItem[]>([]);
    const [feedPage, setFeedPage] = useState(1);
    const [feedHasMore, setFeedHasMore] = useState(true);
    const [feedLoading, setFeedLoading] = useState(false);

    const handleBulkCreate = async (users: Partial<User>[]) => {
        try {
            const { data } = await admin.bulkCreateUsers(users);
            const created = data.users || [];
            setCreatedUsers(created);
            alert(`Successfully created ${created.length} users.`);
        } catch (error: any) {
            console.error("Bulk create failed", error);
            // Show more specific error if available
            const message = error.response?.data?.message || error.message || "Failed to create users.";
            alert(`Bulk creation failed: ${message}\nPlease check your input for duplicates or invalid data.`);
        }
    };

    const handleBanUser = async (userId: string, _name?: string) => {
        if (!confirm(`Are you sure you want to ban user ${_name || userId}?`)) return;
        try {
            await admin.banUser(userId);
            alert("User banned successfully.");
            // Update feed to show banned status if needed, or remove their posts
            // Refresh users list
            const { data } = await userApi.getAll({ limit: 10 });
            setRecentUsers(data.users.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                status: u.banned ? 'Suspended' : (u.verified ? 'Active' : 'Pending'),
                joined: new Date(u.createdAt || Date.now()).toLocaleDateString()
            })));
        } catch (e) {
            console.error(e);
            alert("Failed to ban user.");
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            await admin.approveUser(userId);
            // Optimistically update UI
            setRecentUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Active' } : u));
            alert("User approved successfully.");
        } catch (e) {
            console.error(e);
            alert("Failed to approve user.");
        }
    };

    const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const handleOpenBulkApprove = () => {
        const pending = recentUsers.filter(u => u.status === 'Pending' || u.status === 'pending');
        if (pending.length === 0) {
            alert("No pending users to review.");
            return;
        }
        setSelectedUsers(pending.map(u => u.id)); // Select all by default
        setIsBulkApproveOpen(true);
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (selectedUsers.length === 0) return;

        if (!confirm(`Are you sure you want to ${action} ${selectedUsers.length} users?`)) return;

        try {
            if (action === 'approve') {
                await admin.bulkApproveUsers(selectedUsers);
                setRecentUsers(prev => prev.map(u => selectedUsers.includes(u.id) ? { ...u, status: 'Active' } : u));
                alert(`Successfully approved ${selectedUsers.length} users.`);
            } else {
                // Reject logic - essentially banning or deleting them appropriately
                await Promise.all(selectedUsers.map(id => admin.banUser(id)));
                setRecentUsers(prev => prev.map(u => selectedUsers.includes(u.id) ? { ...u, status: 'Suspended' } : u));
                alert(`Successfully rejected ${selectedUsers.length} users.`);
            }
            setIsBulkApproveOpen(false);
        } catch (e) {
            console.error(e);
            alert(`Failed to ${action} users.`);
        }
    };

    const handleDeleteContent = async (type: string, id: string) => {
        if (!confirm("Are you sure you want to delete this content?")) return;
        try {
            await admin.removeItem(type, id);
            setContentFeed(prev => prev.filter(item => item.id !== id));
            alert("Content deleted.");
        } catch (e) {
            console.error(e);
            alert("Failed to delete content.");
        }
    };

    // Fetch initial content feed (using questions for now as a base)
    const fetchFeed = async (page = 1, append = false) => {
        setFeedLoading(true);
        try {
            // Using questions endpoint directly as the feed source
            const { data } = await questions.getAll({ page, limit: 20, sort: 'newest' });

            const newItems: FeedItem[] = questionsList.map((q: Question) => ({ ...q, type: 'question' }));

            if (append) {
                setContentFeed(prev => [...prev, ...newItems]);
            } else {
                setContentFeed(newItems);
            }
            // If we got fewer items than limit, no more pages
            setFeedHasMore(newItems.length === 20);
        } catch (e) {
            console.error("Failed to fetch feed", e);
            // Optionally set error state here to show in UI
        } finally {
            setFeedLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed(1);
    }, []);

    const handleLoadMoreFeed = () => {
        const nextPage = feedPage + 1;
        setFeedPage(nextPage);
        fetchFeed(nextPage, true);
    };

    const { token, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !token) return;

        // Socket connection with auth token
        const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
            auth: {
                token: `Bearer ${token}`
            }
        });

        newSocket.on('connect', () => {
            console.log("Connected to admin socket");
            newSocket.emit('join_admin_room');
        });

        newSocket.on('admin_new_question', (data: Question) => {
            setContentFeed(prev => [{ ...data, type: 'question', timestamp: new Date() } as FeedItem, ...prev]);
        });
        newSocket.on('admin_new_answer', (data: Answer) => {
            setContentFeed(prev => [{ ...data, type: 'answer', timestamp: new Date() } as FeedItem, ...prev]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, token]);

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
                    console.log(data)
                } catch (error) {
                    console.error("Failed to fetch system stats", error);
                }

                // Fetch users
                let usersList = [];
                try {
                    const { data } = await userApi.getAll({ limit: 10 });
                    usersList = data.users || [];
                    setRecentUsers(usersList.map((u: User) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                        status: u.banned ? 'Suspended' : (u.verified ? 'Active' : 'Pending'),
                    })));
                } catch {
                    // Fallback to specialists
                    try {
                        const { data } = await userApi.getSpecialists();
                        setRecentUsers(data.map((u: User) => ({
                            id: u.id,
                            name: u.name,
                            role: 'Specialist',
                            status: 'Active',
                            joined: 'Unknown'
                        })));
                    } catch {
                        // Ignore errors for fallback
                    }
                }

                // Fetch reports
                try {
                    const { data: reportsData } = await admin.getReports('pending');
                    const fetchedReports = reportsData || [];
                    setReports(fetchedReports);
                    setReportsCount(fetchedReports.length);
                } catch {
                    console.error("Failed to fetch reports");
                }

                // Update Stats Display
                setStats([
                    { title: 'Total Users', value: systemStats.totalUsers.toString(), change: '+0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
                    { title: 'Total Posts', value: systemStats.pendingReports.toString(), change: '+0', icon: FileText, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20' },
                    { title: 'Pending Reports', value: systemStats.newPosts.toString(), change: '+0', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/20' },
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

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
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <SidebarItem
                        icon={Users}
                        label="User Management"
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                    />
                    <SidebarItem
                        icon={FileText}
                        label="Content Moderation"
                        active={activeTab === 'moderation'}
                        onClick={() => setActiveTab('moderation')}
                    />
                    <SidebarItem
                        icon={AlertTriangle}
                        label="Reports"
                        active={activeTab === 'reports'}
                        onClick={() => setActiveTab('reports')}
                        badge={reportsCount > 0 ? reportsCount.toString() : undefined}
                    />
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-700">
                        <SidebarItem
                            icon={Settings}
                            label="Settings"
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                        />
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white capitalize">
                                {activeTab === 'overview' ? 'Dashboard Overview' : activeTab.replace('-', ' ')}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Welcome back, Admin.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                                <Activity size={14} /> System Healthy
                            </span>
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    {activeTab === 'overview' && (
                        <>
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
                                    <button onClick={() => setActiveTab('users')} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline">
                                        View All
                                    </button>
                                </div>
                                <UserTable users={recentUsers} onBan={handleBanUser} onApprove={handleApprove} />
                            </div>
                        </>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">All Users</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleOpenBulkApprove}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Review Pending Users
                                    </button>
                                    <button
                                        onClick={() => { setCreatedUsers([]); setIsBulkCreateOpen(true); }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                    >
                                        <Users size={18} /> Bulk Create
                                    </button>
                                </div>
                            </div>
                            <UserTable users={recentUsers} onBan={handleBanUser} onApprove={handleApprove} />
                        </div>
                    )}

                    {activeTab === 'moderation' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Activity size={20} className="text-green-500" /> Live Content Feed
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Real-time stream of new questions and answers.</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full font-medium animate-pulse">
                                    • Live
                                </span>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
                                {contentFeed.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex justify-center mb-4">
                                            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center animate-pulse">
                                                <Activity className="text-blue-500" size={32} />
                                            </div>
                                        </div>
                                        <p className="text-lg font-medium">Waiting for new activity...</p>
                                        <p className="text-sm mt-1">New posts will appear here instantly.</p>
                                    </div>
                                ) : (
                                    contentFeed.map((item, index) => (
                                        <div key={item.id || index} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors animate-fade-in-up">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.type === 'question'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                            }`}>
                                                            {item.type}
                                                        </span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            by <span className="font-medium text-gray-900 dark:text-white">
                                                                {typeof item.userId === 'object' && item.userId ? item.userId.name : 'Unknown User'}
                                                            </span>
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(item.createdAt || item.timestamp || Date.now()).toLocaleTimeString()}
                                                        </span>
                                                    </div>

                                                    {item.title && (
                                                        <h4 className="font-bold text-gray-800 dark:text-white mb-1">{item.title}</h4>
                                                    )}
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                                                        {item.description || item.content}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const uid = typeof item.userId === 'object' && item.userId ? item.userId.id : item.userId;
                                                            if (typeof uid === 'string') handleBanUser(uid);
                                                        }}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                        title="Ban User"
                                                    >
                                                        <Users size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteContent(item.type, item.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete Content"
                                                    >
                                                        <Trash size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {feedHasMore && (
                                    <div className="p-4 text-center border-t border-gray-100 dark:border-slate-700">
                                        <button
                                            onClick={handleLoadMoreFeed}
                                            disabled={feedLoading}
                                            className="px-6 py-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {feedLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="animate-spin" size={16} /> Loading...
                                                </span>
                                            ) : 'Load More Activity'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Pending Reports</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target ID</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {reports.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    No pending reports found.
                                                </td>
                                            </tr>
                                        ) : (
                                            reports.map((report: Report) => (
                                                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="capitalize px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-sm">{report.targetType}</span>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs truncate text-gray-700 dark:text-gray-300">
                                                        {report.reason}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                        {report.targetId}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button className="text-red-500 hover:text-red-700 font-medium text-sm">Resolve</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="p-12 text-center text-gray-500">
                            Settings coming soon...
                        </div>
                    )}

                </div>
            </main>

            {/* Bulk Review Modal */}
            {isBulkApproveOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Review Pending Users</h3>
                            <button onClick={() => setIsBulkApproveOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Review the users waiting for approval. Select users to approve or reject.
                            </p>

                            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                                        <tr>
                                            <th className="p-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={recentUsers.filter(u => u.status === 'Pending').every(u => selectedUsers.includes(u.id))}
                                                    onChange={(e) => {
                                                        const pending = recentUsers.filter(u => u.status === 'Pending');
                                                        if (e.target.checked) {
                                                            setSelectedUsers(pending.map(u => u.id));
                                                        } else {
                                                            setSelectedUsers([]);
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="p-3">User</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Role</th>
                                            <th className="p-3">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {recentUsers.filter(u => u.status === 'Pending' || u.status === 'pending').map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-slate-800/50">
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={() => toggleUserSelection(user.id)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{user?.name}</td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400">{user?.email || "N/A"}</td>
                                                <td className="p-3">{user?.role}</td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400">{user?.joined}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedUsers.length} users selected
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleBulkAction('reject')}
                                        disabled={selectedUsers.length === 0}
                                        className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition disabled:opacity-50 font-medium"
                                    >
                                        Reject Selected
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('approve')}
                                        disabled={selectedUsers.length === 0}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Approve Selected
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Create Modal */}
            {isBulkCreateOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Bulk Create Users</h3>
                            <button onClick={() => setIsBulkCreateOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {createdUsers.length > 0 ? (
                                <div>
                                    <div>
                                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <p className="text-green-700 dark:text-green-300 font-medium">Successfully created {createdUsers.length} users!</p>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Please copy these credentials. Passwords will not be shown again.</p>
                                        <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700 overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead>
                                                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                                                        <th className="pb-2">Name</th>
                                                        <th className="pb-2">Email</th>
                                                        <th className="pb-2">Password</th>
                                                        <th className="pb-2">Role</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {createdUsers.map((u, i) => (
                                                        <tr key={i} className="border-b border-gray-100 dark:border-slate-800 last:border-0">
                                                            <td className="py-2 pr-4">{u.name}</td>
                                                            <td className="py-2 pr-4">{u.email}</td>
                                                            <td className="py-2 pr-4 font-mono text-blue-600 dark:text-blue-400">{u.password}</td>
                                                            <td className="py-2">{u.role}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button
                                                onClick={() => setIsBulkCreateOpen(false)}
                                                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-center py-8">
                                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Users Created Successfully!</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                                            {createdUsers.length} users have been added to the system.
                                        </p>

                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => {
                                                    const csvContent = "data:text/csv;charset=utf-8,"
                                                        + "Name,Email,Password,Role\n"
                                                        + createdUsers.map((u: any) => `${u.name},${u.email},${u.password},${u.role}`).join("\n");

                                                    const encodedUri = encodeURI(csvContent);
                                                    const link = document.createElement("a");
                                                    link.setAttribute("href", encodedUri);
                                                    link.setAttribute("download", `created_users_${new Date().toISOString().slice(0, 10)}.csv`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                            >
                                                <Upload size={18} className="transform rotate-180" /> Download Credentials
                                            </button>
                                            <button
                                                onClick={() => setCreatedUsers([])}
                                                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                                            >
                                                Create More
                                            </button>
                                        </div>

                                        <div className="mt-8 text-left max-h-60 overflow-y-auto border rounded-lg border-gray-200 dark:border-slate-700">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                                <thead className="bg-gray-50 dark:bg-slate-800">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                                    {createdUsers.map((user: any, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{user.password}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <BulkCreateForm onSubmit={handleBulkCreate} />
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

const BulkCreateForm = ({ onSubmit }: { onSubmit: (users: Partial<User>[]) => void }) => {
    const [rows, setRows] = useState<{ name: string; email: string; role: User['role'] }[]>([{ name: '', email: '', role: 'student' }]);
    const [loading, setLoading] = useState(false);

    const addRow = () => {
        setRows([...rows, { name: '', email: '', role: 'student' }]);
    };

    const removeRow = (index: number) => {
        if (rows.length > 1) {
            const newRows = [...rows];
            newRows.splice(index, 1);
            setRows(newRows);
        }
    };

    const updateRow = (index: number, field: string, value: string) => {
        const newRows = [...rows];
        // Dynamic assignment
        newRows[index] = { ...newRows[index], [field]: value } as unknown as { name: string; email: string; role: User['role'] };
        setRows(newRows);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Basic CSV parsing logic
            // Supports formats: Name,Email,Role OR Name,Email
            // Ignores header if first row looks like header
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            const newRows: { name: string; email: string; role: User['role'] }[] = [];

            lines.forEach((line, index) => {
                // Split by comma, handling basic cases only
                const parts = line.split(',').map(p => p.trim());
                if (parts.length < 2) return; // Skip invalid lines

                // Heuristic to skip header
                if (index === 0 && (parts[0].toLowerCase().includes('name') || parts[1].toLowerCase().includes('email'))) {
                    return;
                }

                const name = parts[0];
                const email = parts[1];
                let role: User['role'] = 'student';

                if (parts.length > 2) {
                    const r = parts[2].toLowerCase();
                    if (r === 'admin' || r === 'specialist') {
                        role = r;
                    }
                }

                if (name && email && email.includes('@')) {
                    newRows.push({ name, email, role });
                }
            });

            if (newRows.length > 0) {
                // Keep existing rows if they have data, else replace the empty initial row
                const currentRowsHaveData = rows.some(r => r.name || r.email);
                if (currentRowsHaveData) {
                    setRows([...rows, ...newRows]);
                } else {
                    setRows(newRows);
                }
                alert(`Successfully imported ${newRows.length} users from CSV.`);
            } else {
                alert("No valid users found in CSV. Please ensure format: Name, Email, Role (optional)");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validation
        const validRows = rows.filter(r => r.name && r.email);
        if (validRows.length === 0) return;

        setLoading(true);
        // Cast rows to Partial<User>[] because we know the structure matches
        await onSubmit(validRows as unknown as Partial<User>[]);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Upload size={16} /> Import from File
                    </h4>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                    Upload a CSV file with columns: <strong>Name, Email, Role (optional)</strong>.
                </p>
                <div className="flex gap-2">
                    <label className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-sm">
                        <span>Select CSV File</span>
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-1"></div>
                </div>
                {rows.map((row, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={row.name}
                                onChange={(e) => updateRow(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="col-span-4">
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={row.email}
                                onChange={(e) => updateRow(index, 'email', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="col-span-3">
                            <select
                                value={row.role}
                                onChange={(e) => updateRow(index, 'role', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="student">Student</option>
                                <option value="specialist">Specialist</option>
                            </select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                            {rows.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addRow}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add another user
            </button>

            <div className="pt-4 flex justify-end gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin h-4 w-4" />}
                    Create Users
                </button>
            </div>
        </form>
    );
};

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
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

const UserTable = ({ users }: { users: UserRow[]; }) => (
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'Specialist'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`flex items-center gap-1.5 text-sm ${user.status === 'Active' ? 'text-green-600 dark:text-green-400' :
                                user.status === 'Suspended' ? 'text-red-600 dark:text-red-400' : 'text-orange-500'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' :
                                    user.status === 'Suspended' ? 'bg-red-500' : 'bg-orange-500'
                                    }`}></span>
                                {user.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.joined}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                <MoreVertical size={18} />
                            </button>
                        </td>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors relative">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                        {user.name?.charAt(0) || 'U'}
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'Specialist'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`flex items-center gap-1.5 text-sm ${user.status === 'Active' ? 'text-green-600 dark:text-green-400' :
                                    user.status === 'Suspended' ? 'text-red-600 dark:text-red-400' : 'text-orange-500'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' :
                                        user.status === 'Suspended' ? 'bg-red-500' : 'bg-orange-500'
                                        }`}></span>
                                    {user.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {user.joined}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right relative">
                                <button
                                    onClick={() => toggleMenu(user.id)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {openMenuId === user.id && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setOpenMenuId(null)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 z-20 py-1 text-left">
                                            {user.status !== 'Active' && user.status !== 'Suspended' && (
                                                <button
                                                    onClick={() => {
                                                        onApprove(user.id);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                >
                                                    <CheckCircle size={14} /> Approve User
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    onBan(user.id, user.name);
                                                    setOpenMenuId(null);
                                                }}
                                                className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                            >
                                                <AlertTriangle size={14} /> Ban User
                                            </button>
                                        </div>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;
