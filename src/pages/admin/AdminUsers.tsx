
import { useState, useEffect } from 'react';
import { admin, users as userApi } from '../../services/api';
import { Users, CheckCircle, Upload } from 'lucide-react';
import UserTable from '../../components/admin/UserTable';
import BulkCreateForm from '../../components/admin/BulkCreateForm';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/SearchBar';

const AdminUsers = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false);
    const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [createdUsers, setCreatedUsers] = useState<any[]>([]);

    const [allUsers, setAllUsers] = useState<any[]>([]); // Store all users
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]); // Store filtered users
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const LIMIT = 10;

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetching all users (or large limit) to handle pagination client-side
            const { data } = await userApi.getAll({ limit: 1000 });
            const formattedUsers = (data.users || []).map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                status: u.banned ? 'Suspended' : (u.verified ? 'Active' : 'Pending'),
                joined: new Date(u.createdAt || Date.now()).toLocaleDateString()
            }));

            setAllUsers(formattedUsers);
            setFilteredUsers(formattedUsers);
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setLoading(false);
        }
    };

    // Search & Filter Logic
    useEffect(() => {
        let isMounted = true;
        const performSearch = async () => {
            // 1. If query is empty, reset to all users
            if (!searchQuery) {
                if (isMounted) {
                    setFilteredUsers(allUsers);
                    setTotalPages(Math.ceil(allUsers.length / LIMIT) || 1);
                    setPage(1);
                }
                return;
            }

            const lowerQuery = searchQuery.toLowerCase();

            // 2. Try local search first
            const localMatches = allUsers.filter(u =>
                u.name?.toLowerCase().includes(lowerQuery) ||
                u.email?.toLowerCase().includes(lowerQuery)
            );

            if (localMatches.length > 0) {
                if (isMounted) {
                    setFilteredUsers(localMatches);
                    setTotalPages(Math.ceil(localMatches.length / LIMIT) || 1);
                    setPage(1);
                }
            } else {
                // 3. Fallback to server search if locally not found
                if (isMounted) setLoading(true);
                try {
                    const { data } = await userApi.getAll({ search: searchQuery });
                    if (isMounted) {
                        const serverMatches = (data.users || []).map((u: any) => ({
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                            status: u.banned ? 'Suspended' : (u.verified ? 'Active' : 'Pending'),
                            joined: new Date(u.createdAt || Date.now()).toLocaleDateString()
                        }));

                        setFilteredUsers(serverMatches);
                        setTotalPages(Math.ceil(serverMatches.length / LIMIT) || 1);
                        setPage(1);
                    }
                } catch (error) {
                    console.error("Search failed", error);
                    if (isMounted) {
                        setFilteredUsers([]);
                        setTotalPages(1);
                    }
                } finally {
                    if (isMounted) setLoading(false);
                }
            }
        };

        performSearch();

        return () => { isMounted = false; };
    }, [searchQuery, allUsers]);

    // Pagination logic
    useEffect(() => {
        const startIndex = (page - 1) * LIMIT;
        setUsers(filteredUsers.slice(startIndex, startIndex + LIMIT));
    }, [page, filteredUsers]);

    useEffect(() => {
        fetchUsers();
    }, []);


    const handleBanUser = async (userId: string, _name?: string) => {
        if (!confirm(`Are you sure you want to ban user ${_name || userId}?`)) return;
        try {
            await admin.banUser(userId);
            alert("User banned successfully.");
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Suspended' } : u));
        } catch (e) {
            console.error(e);
            alert("Failed to ban user.");
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            await admin.approveUser(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Active' } : u));
            alert("User approved successfully.");
        } catch (e) {
            console.error(e);
            alert("Failed to approve user.");
        }
    };

    const handleOpenBulkApprove = () => {
        const pending = users.filter(u => u.status === 'Pending');
        if (pending.length === 0) {
            alert("No pending users to review.");
            return;
        }
        setSelectedUsers(pending.map(u => u.id));
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
                setUsers(prev => prev.map(u => selectedUsers.includes(u.id) ? { ...u, status: 'Active' } : u));
                alert(`Successfully approved ${selectedUsers.length} users.`);
            } else {
                await Promise.all(selectedUsers.map(id => admin.banUser(id)));
                setUsers(prev => prev.map(u => selectedUsers.includes(u.id) ? { ...u, status: 'Suspended' } : u));
                alert(`Successfully rejected ${selectedUsers.length} users.`);
            }
            setIsBulkApproveOpen(false);
        } catch (e) {
            console.error(e);
            alert(`Failed to ${action} users.`);
        }
    };

    const handleBulkCreate = async (newUsers: any[]) => {
        try {
            const { data } = await admin.bulkCreateUsers(newUsers);
            const created = data.users || [];
            setCreatedUsers(created);
            alert(`Successfully created ${created.length} users.`);
            fetchUsers(); // Refresh list on current page
        } catch (error: any) {
            console.error("Bulk create failed", error);
            const message = error.response?.data?.message || error.message || "Failed to create users.";
            alert(`Bulk creation failed: ${message}\nPlease check your input for duplicates or invalid data.`);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white capitalize">
                    User Management
                </h1>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">All Users</h3>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="w-full md:w-64">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search users..."
                                debounceTime={300}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleOpenBulkApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 whitespace-nowrap"
                            >
                                <CheckCircle size={18} /> Review Pending
                            </button>
                            <button
                                onClick={() => { setCreatedUsers([]); setIsBulkCreateOpen(true); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap"
                            >
                                <Users size={18} /> Bulk Create
                            </button>
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : (
                    <>
                        <UserTable users={users} onBan={handleBanUser} onApprove={handleApprove} />
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(p) => setPage(p)}
                            isLoading={loading}
                        />
                    </>
                )}
            </div>

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
                                                    checked={users.filter(u => u.status === 'Pending').length > 0 && users.filter(u => u.status === 'Pending').every(u => selectedUsers.includes(u.id))}
                                                    onChange={(e) => {
                                                        const pending = users.filter(u => u.status === 'Pending');
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
                                        {users.filter(u => u.status === 'Pending').map((user) => (
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
                                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <p className="text-green-700 dark:text-green-300 font-medium">Successfully created {createdUsers.length} users!</p>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Please copy these credentials. Passwords will not be shown again.</p>

                                    <div className="flex justify-center gap-4 mt-6">
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
                                </div>
                            ) : (
                                <BulkCreateForm onSubmit={handleBulkCreate} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminUsers;
