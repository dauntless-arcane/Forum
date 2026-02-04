import { ThumbsUp, CheckCircle } from 'lucide-react';
import { Answer, User } from '../types';

interface AnswerCardProps {
  answer: Answer;
  author: User;
  onUpvote?: () => void;
}

export default function AnswerCard({ answer, author, onUpvote }: AnswerCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-white dark:bg-slate-800 border ${answer.isBest ? 'border-accent' : 'border-beige/30 dark:border-slate-700'} rounded-lg p-5`}>
      {answer.isBest && (
        <div className="flex items-center gap-2 text-accent mb-3 font-medium">
          <CheckCircle size={18} />
          <span className="text-sm">Best Answer</span>
        </div>
      )}
      <div className="flex items-start gap-4">
        <button
          onClick={onUpvote}
          className="flex flex-col items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-secondary transition-colors"
        >
          <ThumbsUp size={20} />
          <span className="text-sm font-medium">{answer.upvotes}</span>
        </button>
        <div className="flex-1">
          <p className="text-gray-800 dark:text-slate-200 mb-4 leading-relaxed">{answer.content}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-500">
            <span>{author.avatar}</span>
            <span className="font-medium">{author.name}</span>
            <span>•</span>
            <span>{formatDate(answer.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
