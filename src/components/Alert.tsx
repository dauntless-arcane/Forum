import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
    message: string;
    type?: 'error' | 'success' | 'info' | 'warning';
    onClose?: () => void;
}

export default function Alert({ message, type = 'error', onClose }: AlertProps) {
    if (!message) return null;

    const styles = {
        error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    };

    const icons = {
        error: AlertCircle,
        success: CheckCircle,
        info: Info,
        warning: AlertCircle,
    };

    const Icon = icons[type];

    return (
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${styles[type]} mb-4 animate-fade-in`}>
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{message}</div>
            {onClose && (
                <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                    <XCircle className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
