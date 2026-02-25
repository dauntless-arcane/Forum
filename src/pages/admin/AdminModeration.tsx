
import { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    Trash,
    Loader2,
    Eye
} from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { admin, questions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

import { useSocket } from '../../hooks/useSocket';
import { LiveToastContainer, useToasts } from '../../components/LiveToast';

const AdminModeration = () => {
    const [contentFeed, setContentFeed] = useState<any[]>([]);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedPage, setFeedPage] = useState(1);
    const [feedHasMore, setFeedHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [blockedWords, setBlockedWords] = useState<string[]>([]);
    const [newBlockedWord, setNewBlockedWord] = useState('');

    // Confirm-action modal state
    const [actionModal, setActionModal] = useState<{
        type: 'ban' | 'delete' | null;
        targetId: string;
        targetName: string;
        itemType?: string;
    }>({ type: null, targetId: '', targetName: '' });
    const [actionLoading, setActionLoading] = useState(false);

    const { token, isAuthenticated } = useAuth();

    // --- Toast notifications ---
    const { toasts, addToast, dismissToast } = useToasts();

    // --- Socket connection (admin auth) ---
    const { socket, connected } = useSocket({
        authToken: token,
        enabled: isAuthenticated && !!token,
        autoJoin: [{ event: 'join_admin_room', payload: token }],
    });

    const fetchBlockedWords = async () => {
        try {
            const { data } = await admin.getBlockedWords();
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
            const { data } = await questions.getAll({ page, limit: 20, sort: 'newest' });

            const questionsList = data.questions || [];
            const newItems = questionsList.map((q: any) => ({ ...q, type: 'question' }));

            if (append) {
                setContentFeed(prev => [...prev, ...newItems]);
            } else {
                setContentFeed(newItems);
            }
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

    // --- Confirm action handlers (replacing raw confirm/alert) ---
    const confirmAction = (type: 'ban' | 'delete', targetId: string, targetName: string, itemType?: string) => {
        setActionModal({ type, targetId, targetName, itemType });
    };

    const executeAction = async () => {
        if (!actionModal.type) return;
        setActionLoading(true);
        try {
            if (actionModal.type === 'delete') {
                await admin.removeItem(actionModal.itemType || 'question', actionModal.targetId);
                setContentFeed(prev => prev.filter(item => item.id !== actionModal.targetId));
            } else if (actionModal.type === 'ban') {
                await admin.banUser(actionModal.targetId);
            }
        } catch (e) {
            console.error(e);
            alert(`Failed to ${actionModal.type}.`);
        } finally {
            setActionLoading(false);
            setActionModal({ type: null, targetId: '', targetName: '' });
        }
    };

    // --- Socket event listeners ---
    useEffect(() => {
        if (!socket) return;

        const handleAdminNewQuestion = (data: any) => {
            setContentFeed(prev => [{ ...data, type: 'question', timestamp: new Date() }, ...prev]);

            addToast({
                type: 'new_question',
                title: data.title || 'New Question',
                preview: data.description?.slice(0, 80),
                tags: data.tags,
                linkTo: data.id ? `/question/${data.id}` : undefined,
            });
        };

        const handleAdminNewAnswer = (data: any) => {
            setContentFeed(prev => [{ ...data, type: 'answer', timestamp: new Date() }, ...prev]);

            addToast({
                type: 'admin_new_answer',
                title: `New answer by ${data.user?.name || 'Unknown'}`,
                preview: data.content?.slice(0, 80),
                tags: data.tags,
                linkTo: data.questionId ? `/question/${data.questionId}` : undefined,
            });
        };

        socket.on('admin_new_question', handleAdminNewQuestion);
        socket.on('admin_new_answer', handleAdminNewAnswer);

        return () => {
            socket.off('admin_new_question', handleAdminNewQuestion);
            socket.off('admin_new_answer', handleAdminNewAnswer);
        };
    }, [socket, addToast]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Toast Notifications */}
            <LiveToastContainer toasts={toasts} onDismiss={dismissToast} />

            {/* Confirm Action Modal */}
            {actionModal.type && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {actionModal.type === 'ban' ? '⚠️ Ban User' : '🗑️ Delete Content'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {actionModal.type === 'ban'
                                ? `Are you sure you want to ban "${actionModal.targetName}"? They will lose access.`
                                : `Are you sure you want to permanently delete this ${actionModal.itemType || 'content'}?`}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setActionModal({ type: null, targetId: '', targetName: '' })}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={actionLoading}
                                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${actionModal.type === 'ban'
                                    ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
                                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                                    }`}
                            >
                                {actionLoading ? 'Processing...' : actionModal.type === 'ban' ? 'Ban User' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-fit">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Activity size={20} className="text-green-500" /> Live Content Feed
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time stream of new questions and answers.</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${connected
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 animate-pulse'
                        : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                        }`}>
                        {connected ? '● Live' : '○ Offline'}
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
                        useWindowScroll
                        className="divide-y divide-gray-100 dark:divide-slate-700 w-full"
                        data={contentFeed}
                        endReached={() => feedHasMore && !isFetchingMore && handleLoadMoreFeed()}
                        itemContent={(_, item) => (
                            <div className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors animate-fade-in-up">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.type === 'question'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                by <span className="font-medium text-gray-900 dark:text-white">{item.userId?.name || item.user?.name || 'Unknown User'}</span>
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(item.createdAt || item.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        {item.title && (
                                            <Link to={`/question/${item.id}`} className="block">
                                                <h4 className="font-bold text-gray-800 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words">{item.title}</h4>
                                            </Link>
                                        )}
                                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 break-words">
                                            {item.description || item.content}
                                        </p>

                                        {/* Tag chips */}
                                        {item.tags && item.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.tags.map((tag: string) => (
                                                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Link
                                            to={`/question/${item.id}`}
                                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="View"
                                        >
                                            <Eye size={18} />
                                        </Link>
                                        <button
                                            onClick={() => confirmAction('ban', item.userId?.id || item.userId, item.userId?.name || item.user?.name || 'this user')}
                                            className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                            title="Ban User"
                                        >
                                            <Users size={18} />
                                        </button>
                                        <button
                                            onClick={() => confirmAction('delete', item.id, item.title || 'this content', item.type)}
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
