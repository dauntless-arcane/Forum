import { useState, useEffect, useCallback } from "react";
import { Loader2, ArrowUp } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { questions as questionApi, answers as answerApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Question } from "../types";
import { Link } from "react-router-dom";
import Alert from '../components/Alert';

import { useSocket } from '../hooks/useSocket';
import { LiveToastContainer, useToasts } from '../components/LiveToast';

export default function SpecialistDashboard() {
  const { user, token } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("pending");
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // --- Toast notifications ---
  const { toasts, addToast, dismissToast } = useToasts();

  // --- Socket connection (authenticated for specialist room) ---
  const { socket } = useSocket({
    authToken: token,
    enabled: !!token,
    autoJoin: [
      { event: 'join_specialist_room', payload: token },
      { event: 'join_explore' },
    ],
  });

  const fetchQuestions = useCallback(async (pageNumber = 1, shouldAppend = false) => {
    if (pageNumber === 1) setLoading(true);
    else setIsFetchingMore(true);

    try {
      const params: Record<string, string | number | boolean> = {
        limit: 20,
        page: pageNumber,
        sort: 'newest',
        ownerOnly: false
      };
      if (filter !== 'all') {
        params.status = filter;
      }

      const { data } = await questionApi.getAll(params);

      const newQuestions = data.questions;
      if (shouldAppend) {
        setQuestions(prev => [...prev, ...newQuestions]);
      } else {
        setQuestions(newQuestions);
      }

      setHasMore(newQuestions.length === 20);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setError("Failed to load questions");
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    setPage(1);
    fetchQuestions(1, false);
  }, [filter, fetchQuestions]);

  // --- Socket event listeners ---
  useEffect(() => {
    if (!socket) return;

    const handleNewQuestion = (data: any) => {
      // Add to pending queue
      setPendingQuestions(prev => [data, ...prev]);

      addToast({
        type: 'new_question',
        title: data.title || 'New Question',
        preview: data.description?.slice(0, 80),
        tags: data.tags,
        linkTo: data.id ? `/question/${data.id}` : undefined,
      });
    };

    const handleNewAnswer = (data: any) => {
      addToast({
        type: 'new_answer',
        title: `New answer on: ${data.questionTitle || 'a question'}`,
        preview: data.content?.slice(0, 80),
        tags: data.tags,
        linkTo: data.questionId ? `/question/${data.questionId}` : undefined,
      });
    };

    const handleQuestionUpdated = (data: any) => {
      setQuestions(prev => prev.map(q => q.id === data.id ? { ...q, ...data } : q));

      addToast({
        type: 'question_updated',
        title: data.title || 'Question Updated',
        tags: data.tags,
        linkTo: data.id ? `/question/${data.id}` : undefined,
      });
    };

    const handleQuestionDeleted = (data: any) => {
      setQuestions(prev => prev.filter(q => q.id !== data.id));
      setPendingQuestions(prev => prev.filter(q => q.id !== data.id));

      addToast({
        type: 'question_deleted',
        title: 'Question Removed',
        tags: data.tags,
      });
    };

    socket.on('new_question', handleNewQuestion);
    socket.on('new_answer', handleNewAnswer);
    socket.on('question_updated', handleQuestionUpdated);
    socket.on('question_deleted', handleQuestionDeleted);

    return () => {
      socket.off('new_question', handleNewQuestion);
      socket.off('new_answer', handleNewAnswer);
      socket.off('question_updated', handleQuestionUpdated);
      socket.off('question_deleted', handleQuestionDeleted);
    };
  }, [socket, addToast]);

  const handleApplyPending = () => {
    if (pendingQuestions.length === 0) return;
    setQuestions(prev => [...pendingQuestions, ...prev]);
    setPendingQuestions([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchQuestions(nextPage, true);
  };

  const handleReply = async (questionId: string) => {
    const content = replyContent[questionId];
    if (!content || !content.trim()) return;

    // Clear previous errors
    setErrorMessages(prev => ({ ...prev, [questionId]: '' }));

    if (content.length < 10) {
      setErrorMessages(prev => ({ ...prev, [questionId]: "Answer must be at least 10 characters." }));
      return;
    }

    setSubmitting(prev => ({ ...prev, [questionId]: true }));
    try {
      await answerApi.create(questionId, { content });

      // Clear reply
      setReplyContent(prev => ({ ...prev, [questionId]: "" }));
      setErrorMessages(prev => ({ ...prev, [questionId]: "" }));

      await fetchQuestions();

    } catch (err) {
      console.error("Failed to submit answer:", err);
      setErrorMessages(prev => ({ ...prev, [questionId]: "Failed to submit answer. Please try again." }));
    } finally {
      setSubmitting(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || user.role !== 'specialist') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">Access Restricted</h1>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            This dashboard is exclusively for verified specialists and professionals.
          </p>
          <Link to="/" className="text-secondary hover:underline">Return to Explore</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Live Toast Notifications */}
      <LiveToastContainer toasts={toasts} onDismiss={dismissToast} />

      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">
        Specialist Panel
      </h1>

      {/* New Questions Pending Banner */}
      {pendingQuestions.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleApplyPending}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all animate-bounce"
          >
            <ArrowUp size={18} />
            <span className="font-bold">{pendingQuestions.length} New Question{pendingQuestions.length > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {["all", "pending", "answered"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as typeof filter)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${filter === tab
              ? "bg-accent text-primary"
              : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Questions Sheet */}
      {questions.length === 0 && !loading ? (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-10 text-center text-gray-600 dark:text-slate-400">
          No questions found for this filter.
        </div>
      ) : (
        <Virtuoso
          useWindowScroll
          data={questions}
          endReached={() => hasMore && !isFetchingMore && handleLoadMore()}
          itemContent={(_, q) => (
            <div className="pb-6" style={{ paddingBottom: '1.5rem' }}>
              <div
                key={q.id}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6"
              >
                <Link to={`/question/${q.id}`} className="block group">
                  <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-2 group-hover:text-secondary text-xl">
                    {q.title}
                  </h2>
                </Link>

                <p className="text-gray-600 dark:text-slate-400 mb-4 whitespace-pre-wrap">
                  {q.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(q.tags || []).map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded">
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-1 text-gray-500">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Existing Answers count */}
                {(q.answerCount || (q.answers && q.answers.length > 0)) ? (
                  <div className="mb-4 text-sm text-gray-500">
                    {q.answerCount ?? q.answers?.length} {(q.answerCount ?? q.answers?.length) === 1 ? 'Answer' : 'Answers'} already
                  </div>
                ) : null}

                {/* Reply Box */}
                <Alert message={errorMessages[q.id]} type="error" onClose={() => setErrorMessages(prev => ({ ...prev, [q.id]: '' }))} />
                <textarea
                  value={replyContent[q.id] || ""}
                  onChange={(e) =>
                    setReplyContent((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  placeholder="Write your professional response..."
                  rows={3}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-200 mb-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-y"
                />

                <button
                  onClick={() => handleReply(q.id)}
                  disabled={submitting[q.id] || !replyContent[q.id]?.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${submitting[q.id] || !replyContent[q.id]?.trim()
                    ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'
                    : 'bg-accent text-primary hover:bg-accent/90'
                    }`}
                >
                  {submitting[q.id] ? 'Submitting...' : 'Submit Answer'}
                </button>
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
  );
}
