
import { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    Trash,
    Loader2
} from 'lucide-react';
import io from 'socket.io-client';
import { admin, questions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminModeration = () => {
    const [contentFeed, setContentFeed] = useState<any[]>([]);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedPage, setFeedPage] = useState(1);
    const [feedHasMore, setFeedHasMore] = useState(true);
    const { token, isAuthenticated } = useAuth();

    const fetchFeed = async (page = 1, append = false) => {
        setFeedLoading(true);
        try {
            // Using questions endpoint directly as the feed source
            const { data } = await questions.getAll({ page, limit: 20, sort: 'newest' });

            const questionsList = data.questions || [];
            const newItems = questionsList.map((q: any) => ({ ...q, type: 'question' }));

            if (append) {
                setContentFeed(prev => [...prev, ...newItems]);
            } else {
                setContentFeed(newItems);
            }
            // If we got fewer items than limit, no more pages
            setFeedHasMore(newItems.length === 20);
        } catch (e) {
            console.error("Failed to fetch feed", e);
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

    const handleBanUser = async (userId: string) => {
        if (!confirm(`Are you sure you want to ban this user?`)) return;
        try {
            await admin.banUser(userId);
            alert("User banned successfully.");
        } catch (e) {
            console.error(e);
            alert("Failed to ban user.");
        }
    };

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

        newSocket.on('admin_new_question', (data: any) => {
            setContentFeed(prev => [{ ...data, type: 'question', timestamp: new Date() }, ...prev]);
        });

        newSocket.on('admin_new_answer', (data: any) => {
            setContentFeed(prev => [{ ...data, type: 'answer', timestamp: new Date() }, ...prev]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, token]);

    return (
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
                                            by <span className="font-medium text-gray-900 dark:text-white">{item.userId?.name || 'Unknown User'}</span>
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(item.createdAt || item.timestamp).toLocaleTimeString()}
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
                                        onClick={() => handleBanUser(item.userId?.id || item.userId)}
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
    );
};

export default AdminModeration;
