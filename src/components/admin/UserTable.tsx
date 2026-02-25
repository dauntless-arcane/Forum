
import { useState } from 'react';
import { MoreVertical, CheckCircle, AlertTriangle } from 'lucide-react';

interface UserTableProps {
    users: any[];
    onBan: (id: string, name?: string) => void;
    onApprove: (id: string) => void;
}

const UserTable = ({ users, onBan, onApprove }: UserTableProps) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const toggleMenu = (userId: string) => {
        if (openMenuId === userId) {
            setOpenMenuId(null);
        } else {
            setOpenMenuId(userId);
        }
    };

    return (
        <div className="w-full pb-32">
            <table className="w-full text-left border-collapse min-w-[800px] hidden md:table">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
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
                                            {
                                                (user.status !== 'Active' || !user.verified) && user.status !== 'Suspended' && (
                                                    <button
                                                        onClick={() => {
                                                            onApprove(user.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                    >
                                                        <CheckCircle size={14} /> Approve User
                                                    </button>
                                                )
                                            }
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

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-4">
                {users.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No users found</div>
                )}
                {users.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-gray-100">{user.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Joined: {user.joined}</div>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => toggleMenu(user.id)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <MoreVertical size={20} />
                                </button>
                                {openMenuId === user.id && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setOpenMenuId(null)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 z-20 py-1 text-left">
                                            {
                                                (user.status !== 'Active' || !user.verified) && user.status !== 'Suspended' && (
                                                    <button
                                                        onClick={() => {
                                                            onApprove(user.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                    >
                                                        <CheckCircle size={14} /> Approve User
                                                    </button>
                                                )
                                            }
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
                            </div>
                        </div>
                        <div className="flex justify-between items-center sm:hidden">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'Specialist'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                {user.role}
                            </span>
                            <span className={`flex items-center gap-1.5 text-sm font-medium ${user.status === 'Active' ? 'text-green-600 dark:text-green-400' :
                                user.status === 'Suspended' ? 'text-red-600 dark:text-red-400' : 'text-orange-500'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' :
                                    user.status === 'Suspended' ? 'bg-red-500' : 'bg-orange-500'
                                    }`}></span>
                                {user.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserTable;
