import { useState, useEffect, useRef } from "react";
import { Loader2, Bell } from "lucide-react";
import io from 'socket.io-client';
import { questions as questionApi, answers as answerApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Question } from "../types";
import { Link } from "react-router-dom";

export default function SpecialistDashboard() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("pending");
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newUpdate, setNewUpdate] = useState(false);

  // Socket connection
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

    socket.on('connect', () => {
      console.log('Specialist connected to socket');
      socket.emit('join_specialist_room');
    });

    socket.on('new_question', (question: Question) => {
      // If we are looking at pending or all, we can prepend it
      if (filter !== 'answered') {
        setQuestions(prev => [question, ...prev]);
        setNewUpdate(true);
        // Auto-hide notification after 3s
        setTimeout(() => setNewUpdate(false), 3000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [filter]);

  const fetchQuestions = async (pageNumber = 1, shouldAppend = false) => {
    if (pageNumber === 1) setLoading(true);

    try {
      const params: any = {
        limit: 20,
        page: pageNumber,
        sort: 'newest'
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

      setHasMore(newQuestions.length === 20); // Basic check, ideally backend returns 'totalPages' or 'hasMore'
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchQuestions(1, false);
  }, [filter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchQuestions(nextPage, true);
  };

  const handleReply = async (questionId: string) => {
    const content = replyContent[questionId];
    if (!content || !content.trim()) return;

    setSubmitting(prev => ({ ...prev, [questionId]: true }));
    try {
      await answerApi.create(questionId, { content });

      // Clear reply
      setReplyContent(prev => ({ ...prev, [questionId]: "" }));

      // Refresh questions to show updated status/answers
      // For "pending" filter, the question should disappear if it becomes answered (backend logic depending)
      // or we just re-fetch.
      await fetchQuestions();

    } catch (err) {
      console.error("Failed to submit answer:", err);
      alert("Failed to submit answer. Please try again.");
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

      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">
        Specialist Panel
      </h1>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8">
        {["all", "pending", "answered"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
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

      {/* New Questions Notification */}
      {newUpdate && (
        <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-3 animate-bounce">
          <Bell size={20} />
          <span className="font-medium">New questions have arrived! The list has been updated.</span>
        </div>
      )}

      {/* Questions Sheet */}
      {questions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-10 text-center text-gray-600 dark:text-slate-400">
          No questions found for this filter.
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => (
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
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8 pb-8">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
