import { Eye, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Question, User } from '../types';
import TagChip from './TagChip';

interface QuestionCardProps {
  question: Question;
  author: User;
}

export default function QuestionCard({ question, author }: QuestionCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link to={`/question/${question.id}`}>
      <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-5 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2 hover:text-secondary transition-colors">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">
              {question.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(question.tags || []).map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-500">
              <div className="flex items-center gap-1">
                <span>{author.avatar}</span>
                <span>{author.name}</span>
              </div>
              <span>•</span>
              <span>{formatDate(question.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2 sm:gap-4 text-sm text-gray-600 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1" title="Answers">
                <MessageSquare size={16} />
                <span>{question.answerCount ?? question.answers?.length ?? 0}</span>
              </div>
              <div className="flex items-center gap-1" title="Views">
                <Eye size={16} />
                <span>{question.views}</span>
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${question.status === 'answered'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                }`}
            >
              {question.status === 'answered' ? 'Answered' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
