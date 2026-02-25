import { useState } from 'react';
import { ThumbsUp, CheckCircle } from 'lucide-react';
import { Answer, User } from '../types';

interface AnswerCardProps {
  answer: Answer;
  author: User;
  currentUserId?: string;
  onUpvote?: () => void;
}

export default function AnswerCard({ answer, author, onUpvote }: AnswerCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const isLiked = answer.isLikedByMe

  const handleUpvote = () => {
    setIsAnimating(true);
    if (onUpvote) onUpvote();
    setTimeout(() => setIsAnimating(false), 500); // Reset animation after 500ms
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-white dark:bg-slate-800 border ${answer.isBest ? 'border-accent' : 'border-beige/30 dark:border-slate-700'} rounded-lg p-5 transition-all hover:shadow-md`}>
      {answer.isBest && (
        <div className="flex items-center gap-2 text-accent mb-3 font-medium">
          <CheckCircle size={18} />
          <span className="text-sm">Best Answer</span>
        </div>
      )}
      <div className="flex items-start gap-4">
        <button
          onClick={handleUpvote}
          className={`flex flex-col items-center gap-1 transition-colors ${isLiked || isAnimating ? 'text-blue-500' : 'text-gray-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
        >
          <ThumbsUp
            size={20}
            className={`transition-transform duration-300 ${isAnimating ? 'animate-bounce' : ''} ${isLiked ? 'fill-current' : ''}`}
          />
          <span className={`text-sm font-medium ${isLiked || isAnimating ? 'font-bold' : ''}`}>{answer.upvotes}</span>
        </button>
        <div className="flex-1">
          <p className="text-gray-800 dark:text-slate-200 mb-4 leading-relaxed whitespace-pre-wrap">{answer.content}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-500">
            {/* Fallback avatar if missing */}
            <span className="inline-block w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs">
              {author.avatar || author.name?.charAt(0) || '?'}
            </span>
            <span className="font-medium text-gray-700 dark:text-slate-300">{author.name}</span>
            <span>•</span>
            <span>{formatDate(answer.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
