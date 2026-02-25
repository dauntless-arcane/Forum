import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Sparkles, RefreshCw, Trash2, X } from 'lucide-react';

export interface ToastItem {
    id: string;
    type: 'new_question' | 'question_updated' | 'question_deleted' | 'new_answer' | 'admin_new_answer';
    title: string;
    preview?: string;
    tags?: string[];
    linkTo?: string;
    /** auto-dismiss duration in ms (default 6000) */
    duration?: number;
}

const iconMap = {
    new_question: { Icon: Sparkles, color: 'text-emerald-400', border: 'border-l-emerald-500', bg: 'from-emerald-500/10' },
    question_updated: { Icon: RefreshCw, color: 'text-blue-400', border: 'border-l-blue-500', bg: 'from-blue-500/10' },
    question_deleted: { Icon: Trash2, color: 'text-red-400', border: 'border-l-red-500', bg: 'from-red-500/10' },
    new_answer: { Icon: MessageSquare, color: 'text-purple-400', border: 'border-l-purple-500', bg: 'from-purple-500/10' },
    admin_new_answer: { Icon: MessageSquare, color: 'text-amber-400', border: 'border-l-amber-500', bg: 'from-amber-500/10' },
};

const labelMap: Record<string, string> = {
    new_question: 'New Question',
    question_updated: 'Question Updated',
    question_deleted: 'Question Deleted',
    new_answer: 'New Answer',
    admin_new_answer: 'New Answer (Admin)',
};

interface LiveToastContainerProps {
    toasts: ToastItem[];
    onDismiss: (id: string) => void;
    duration?: number;   // ✅ add this
}

/**
 * Renders a stack of live-toast notifications in the bottom-right corner.
 * Each toast auto-dismisses after its duration.
 */
export function LiveToastContainer({
    toasts,
    onDismiss,
    duration = 4000,   // default time
}: LiveToastContainerProps) {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <SingleToast key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function SingleToast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
    const [exiting, setExiting] = useState(false);
    const duration = toast.duration || 6000;
    const { Icon, color, border, bg } = iconMap[toast.type] || iconMap.new_question;

    useEffect(() => {
        const exitTimer = setTimeout(() => setExiting(true), duration - 400);
        const removeTimer = setTimeout(() => onDismiss(toast.id), duration);
        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [toast.id, duration, onDismiss]);

    const content = (
        <div
            className={`
        pointer-events-auto
        relative overflow-hidden
        border-l-4 ${border}
        bg-gradient-to-r ${bg} to-white/95 dark:to-slate-800/95
        backdrop-blur-xl
        rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30
        p-4 pr-10
        ${exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
        cursor-pointer
        hover:scale-[1.02] transition-transform duration-150
      `}
        >
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-40 animate-progress-shrink" style={{ animationDuration: `${duration}ms` }} />

            {/* Dismiss button */}
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(toast.id); }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
                <X size={14} className="text-gray-400" />
            </button>

            <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${color}`}>
                    <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">
                        {labelMap[toast.type] || toast.type}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {toast.title}
                    </p>
                    {toast.preview && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{toast.preview}</p>
                    )}
                    {toast.tags && toast.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {toast.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-200/70 dark:bg-slate-700/70 text-gray-600 dark:text-gray-300 rounded-full">
                                    {tag}
                                </span>
                            ))}
                            {toast.tags.length > 3 && (
                                <span className="text-[10px] text-gray-400">+{toast.tags.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (toast.linkTo) {
        return <Link to={toast.linkTo}>{content}</Link>;
    }
    return content;
}

// ---------- Helper hook for managing toast state ----------

let toastCounter = 0;

export function useToasts(maxToasts = 5) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
        const id = `toast-${++toastCounter}-${Date.now()}`;
        setToasts((prev) => [...prev.slice(-(maxToasts - 1)), { ...toast, id }]);
    }, [maxToasts]);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, addToast, dismissToast };
}

