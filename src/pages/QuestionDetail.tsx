import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, ArrowLeft, Loader2 } from 'lucide-react';
import TagChip from '../components/TagChip';
import AnswerCard from '../components/AnswerCard';
import Alert from '../components/Alert';
import { questions as questionApi, answers as answerApi } from '../services/api';
import { Question } from '../types';
import { useAuth } from '../context/AuthContext';

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data } = await questionApi.getById(id);

        // If user is logged in, check which answers they have upvoted
        if (currentUser && data.answers && data.answers.length > 0) {
          try {
            const answerIds = data.answers.map((a: any) => a.id);
            const { data: responseData } = await answerApi.checkUpvoted(answerIds);
            const upvotedIds = responseData.upvotedAnswerIds || [];

            // Merge this info into the answers
            data.answers = data.answers.map((a: any) => ({
              ...a,
              upvotedBy: upvotedIds.includes(a.id) ? [currentUser.id] : []
            }));
          } catch (upvoteError) {
            console.error("Failed to check upvotes", upvoteError);
            // Fallback to local user data if API fails
            if (currentUser.upvotedAnswers) {
              data.answers = data.answers.map((a: any) => ({
                ...a,
                upvotedBy: currentUser.upvotedAnswers?.includes(a.id) ? [currentUser.id] : []
              }));
            }
          }
        }

        setQuestion(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Question not found');
        } else {
          setError('Failed to load question');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id, currentUser]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !id) return;

    setSubmitError('');

    if (answerText.length < 10) {
      setSubmitError("Answer must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await answerApi.create(id, { content: answerText });

      // Reload question to get updated answers
      const { data: updatedQuestion } = await questionApi.getById(id);
      setQuestion(updatedQuestion);
      setAnswerText('');
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setSubmitError('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (answerId: string) => {
    if (!currentUser || !question) return;

    // Optimistically update UI
    setQuestion((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: prev.answers?.map((a) => {
          if (a.id === answerId) {
            const hasUpvoted = a.upvotedBy?.includes(currentUser.id);
            const newUpvotedBy = hasUpvoted
              ? a.upvotedBy?.filter((id) => id !== currentUser.id)
              : [...(a.upvotedBy || []), currentUser.id];

            return {
              ...a,
              upvotes: hasUpvoted ? a.upvotes - 1 : a.upvotes + 1,
              upvotedBy: newUpvotedBy
            };
          }
          return a;
        })
      };
    });

    try {
      await answerApi.upvote(answerId);
    } catch (err) {
      console.error("Failed to upvote:", err);
      // Revert optimistic update on error
      const { data: revertedQuestion } = await questionApi.getById(id!);
      setQuestion(revertedQuestion);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            {error || 'Question Not Found'}
          </h1>
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

  const author = question.user || { id: 'unknown', name: 'Anonymous', avatar: '👤', role: 'student' as const };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>{author.avatar}</span>
              <span className="font-medium">{author.name}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">{formatDate(question.createdAt)}</span>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Eye size={16} />
              <span>{question.views} views</span>
            </div>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{question.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          {question.answers?.length || 0} {question.answers?.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <div className="space-y-4">
          {!question.answers || question.answers.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-slate-400">No answers yet. Be the first to answer!</p>
            </div>
          ) : (
            question.answers.map((answer) => {
              const answerAuthor = answer.user || { id: 'unknown', name: 'Anonymous', avatar: '👤', role: 'student' as const };
              return (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  author={answerAuthor}
                  currentUserId={currentUser?.id}
                  onUpvote={() => handleUpvote(answer.id)}
                />
              );
            })
          )}
        </div>
      </div>

      {currentUser?.role === 'specialist' ? (
        <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Your Answer</h3>
          <Alert message={submitError} type="error" onClose={() => setSubmitError('')} />
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
              disabled={!answerText.trim() || submitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${answerText.trim() && !submitting
                ? 'bg-accent text-primary hover:bg-accent/90'
                : 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-500 cursor-not-allowed'
                }`}
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg p-6 text-center">
          {currentUser ? (
            <p className="text-gray-600 dark:text-slate-400">Only verified professionals can answer questions.</p>
          ) : (
            <p className="text-gray-600 dark:text-slate-400">
              Please <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline">login</button> to post answers.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
