
import { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    Trash,
    Loader2
} from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import io from 'socket.io-client';
import { admin, questions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminModeration = () => {
    const [contentFeed, setContentFeed] = useState<any[]>([]);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedPage, setFeedPage] = useState(1);
    const [feedHasMore, setFeedHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [blockedWords, setBlockedWords] = useState<string[]>([]);
    const [newBlockedWord, setNewBlockedWord] = useState('');

    const { token, isAuthenticated } = useAuth();

    const fetchBlockedWords = async () => {
        try {
            const { data } = await admin.getBlockedWords();
            // Assuming API returns { words: [...] } or just [...]
            setBlockedWords(Array.isArray(data) ? data : data.words || []);
        } catch (e) {
            console.error("Failed to fetch blocked words", e);
        }
    };

    const handleAddBlockedWord = async () => {
        if (!newBlockedWord.trim()) return;
        try {
            await admin.addBlockedWords([newBlockedWord.trim()]);
            setBlockedWords(prev => [...prev, newBlockedWord.trim()]);
            setNewBlockedWord('');
        } catch (e) {
            console.error("Failed to add blocked word", e);
            alert("Failed to add blocked word.");
        }
    };

    const handleRemoveBlockedWord = async (word: string) => {
        try {
            await admin.removeBlockedWord(word);
            setBlockedWords(prev => prev.filter(w => w !== word));
        } catch (e) {
            console.error("Failed to remove blocked word", e);
            alert("Failed to remove blocked word.");
        }
    };

    const fetchFeed = async (page = 1, append = false) => {
        if (page === 1) setFeedLoading(true);
        else setIsFetchingMore(true);
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
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        fetchFeed(1);
        fetchBlockedWords();
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Blocked Words Panel */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden h-fit">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Trash size={20} className="text-red-500" /> Blocked Words
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage automated content filters.</p>
                </div>
                <div className="p-6">
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newBlockedWord}
                            onChange={(e) => setNewBlockedWord(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddBlockedWord()}
                            placeholder="Add word..."
                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        />
                        <button
                            onClick={handleAddBlockedWord}
                            disabled={!newBlockedWord.trim()}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {blockedWords.map((word) => (
                            <span key={word} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm font-medium flex items-center gap-2 group">
                                {word}
                                <button
                                    onClick={() => handleRemoveBlockedWord(word)}
                                    className="hover:text-red-800 dark:hover:text-red-200"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                        {blockedWords.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No blocked words set.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Feed */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
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

                {contentFeed.length === 0 && feedLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : contentFeed.length === 0 ? (
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
                    <Virtuoso
                        style={{ height: '600px' }}
                        className="divide-y divide-gray-100 dark:divide-slate-700 overflow-y-auto"
                        data={contentFeed}
                        endReached={() => feedHasMore && !isFetchingMore && handleLoadMoreFeed()}
                        itemContent={(_, item) => (
                            <div className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors animate-fade-in-up">
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
                        )}
                        components={{
                            Footer: () => (
                                <div className="py-4 flex justify-center min-h-[50px]">
                                    {isFetchingMore && <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
                                </div>
                            )
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminModeration;
