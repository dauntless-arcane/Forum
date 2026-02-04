import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, ArrowLeft } from 'lucide-react';
import { questions, users, currentUser } from '../mockData';
import TagChip from '../components/TagChip';
import AnswerCard from '../components/AnswerCard';

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answerText, setAnswerText] = useState('');

  const question = questions.find((q) => q.id === id);
  const author = question ? users.find((u) => u.id === question.userId) : null;

  if (!question || !author) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">Question Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="text-secondary hover:underline"
          >
            Go back to Explore
          </button>
        </div>
      </div>
    );
  }

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (answerText.trim()) {
      alert('Answer submitted successfully! (This is a demo - no backend)');
      setAnswerText('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-secondary dark:text-soft hover:underline mb-6"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">{question.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {question.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>{author.avatar}</span>
              <span className="font-medium">{author.name}</span>
            </div>
            <span>•</span>
            <span>{formatDate(question.createdAt)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{question.views} views</span>
            </div>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-800 dark:text-slate-200 leading-relaxed">{question.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <div className="space-y-4">
          {question.answers.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-slate-400">No answers yet. Be the first to answer!</p>
            </div>
          ) : (
            question.answers.map((answer) => {
              const answerAuthor = users.find((u) => u.id === answer.userId)!;
              return (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  author={answerAuthor}
                  onUpvote={() => alert('Upvote registered! (Demo only)')}
                />
              );
            })
          )}
        </div>
      </div>

      {currentUser.role === 'specialist' && (
        <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Your Answer</h3>
          <form onSubmit={handleSubmitAnswer}>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Share your expertise and help answer this question..."
              rows={6}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-none mb-4"
              required
            />
            <button
              type="submit"
              disabled={!answerText.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                answerText.trim()
                  ? 'bg-accent text-primary hover:bg-accent/90'
                  : 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </button>
          </form>
        </div>
      )}

      {currentUser.role === 'student' && (
        <div className="bg-gray-50 dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-slate-400">Only specialists can post answers.</p>
        </div>
      )}
    </div>
  );
}
