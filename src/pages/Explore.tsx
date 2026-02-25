import { Filter, Loader2, Eye, ChevronDown, X, Sparkles } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import QuestionCard from '../components/QuestionCard';
import SearchBar from '../components/SearchBar';
import TagChip from '../components/TagChip';
import { questions as questionApi } from '../services/api';
import { Question } from '../types';
import { tags } from '../mockData';

import io, { Socket } from 'socket.io-client';
import { LiveToastContainer, ToastItem } from '../components/LiveToast';

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

let toastCounter = 0;

/* ---------- Helpers ---------- */

const normalizeQuestion = (q: any): Question => ({
  ...q,
  id: q.id || q._id,
});

const dedupeById = (arr: Question[]) => {
  const map = new Map<string, Question>();
  arr.forEach(q => map.set(q.id, q));
  return Array.from(map.values());
};

export default function Explore() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'unanswered'>('latest');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /* ---------- refs for socket ---------- */

  const selectedTagsRef = useRef(selectedTags);
  const searchQueryRef = useRef(searchQuery);
  const sortByRef = useRef(sortBy);

  selectedTagsRef.current = selectedTags;
  searchQueryRef.current = searchQuery;
  sortByRef.current = sortBy;

  /* ---------- toast ---------- */

  const pushToast = useCallback((toast: ToastItem) => {
    setToasts(prev => [...prev, toast].slice(-5));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* ---------- fetch ---------- */

  const fetchQuestions = async (pageNumber = 1, append = false) => {
    if (pageNumber === 1) setLoading(true);
    else setIsFetchingMore(true);

    try {
      const params: any = {
        limit: 20,
        page: pageNumber,
        search: searchQuery || undefined,
        status: sortBy === 'unanswered' ? 'pending' : undefined,
        sort: sortBy === 'latest' ? 'newest' : undefined,
      };

      const { data } = await questionApi.getAll(params);

      let fetched = (data.questions || []).map(normalizeQuestion);

      if (selectedTags.length > 0) {
        fetched = fetched.filter(q =>
          q.tags?.some(tag => selectedTags.includes(tag))
        );
      }

      if (append) {
        setQuestions(prev => dedupeById([...prev, ...fetched]));
      } else {
        setQuestions(fetched);
        setNewIds(new Set());
      }

      setHasMore(fetched.length === 20);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  /* ---------- socket — auto-merge new questions into the feed ---------- */

  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Explore] connected', socket.id);
      socket.emit('join_explore');
    });

    socket.on('new_question', raw => {
      const q = normalizeQuestion(raw);

      const currentTags = selectedTagsRef.current;
      if (currentTags.length && !q.tags?.some(t => currentTags.includes(t))) return;

      // Auto-merge into the feed directly — no button needed
      setQuestions(prev => {
        if (prev.some(p => p.id === q.id)) return prev;
        return [q, ...prev];
      });

      // Track as "new" for the badge animation
      setNewIds(prev => {
        const next = new Set(prev);
        next.add(q.id);
        return next;
      });

      // Auto-clear the "new" badge after 15 s
      setTimeout(() => {
        setNewIds(prev => {
          const next = new Set(prev);
          next.delete(q.id);
          return next;
        });
      }, 15_000);

      pushToast({
        id: `toast-${++toastCounter}`,
        type: 'new_question',
        title: q.title || 'New Question',
        preview: q.description?.slice(0, 80),
        tags: q.tags,
        linkTo: `/question/${q.id}`,
      });
    });

    socket.on('question_updated', raw => {
      const q = normalizeQuestion(raw);

      setQuestions(prev =>
        prev.map(p => (p.id === q.id ? { ...p, ...q } : p))
      );

      pushToast({
        id: `toast-${++toastCounter}`,
        type: 'question_updated',
        title: q.title || 'Question updated',
        linkTo: `/question/${q.id}`,
      });
    });

    socket.on('question_deleted', ({ id, _id }) => {
      const qid = id || _id;

      setQuestions(prev => prev.filter(q => q.id !== qid));

      pushToast({
        id: `toast-${++toastCounter}`,
        type: 'question_deleted',
        title: 'Question removed',
      });
    });

    socket.on('new_answer', data => {
      pushToast({
        id: `toast-${++toastCounter}`,
        type: 'new_answer',
        title: `Answer on: ${data.questionTitle || 'a question'}`,
        preview: data.content?.slice(0, 80),
        linkTo: `/question/${data.questionId}`,
      });
    });

    return () => { socket.disconnect(); };
  }, [pushToast]);

  /* ---------- effects ---------- */

  useEffect(() => {
    setPage(1);
    fetchQuestions(1, false);
  }, [searchQuery, sortBy, selectedTags]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchQuestions(next, true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  /* ---------- tag grouping ---------- */

  const groupedTags = useMemo(() => ({
    psychology: tags.filter(t => t.category === 'psychology').map(t => t.name),
    corporate: tags.filter(t => t.category === 'corporate').map(t => t.name),
    industry: tags.filter(t => t.category === 'industry').map(t => t.name),
  }), []);

  const categoryLabel: Record<string, string> = {
    psychology: '🧠 Psychology',
    corporate: '🏢 Corporate',
    industry: '🏭 Industry',
  };

  /* ---------- UI ---------- */

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      <LiveToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        duration={5000}
      />

      {/* ── Header ─────────────────────────────────── */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary via-secondary to-soft bg-clip-text text-transparent mb-2">
          Explore Questions
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm">
          Discover questions, share your expertise, and learn from the community.
        </p>
      </div>

      {/* ── Search + Filter bar ───────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="tour-search flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center gap-2 shrink-0">
          {/* Sort pills */}
          <div className="flex bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden text-sm shadow-sm">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex-1 min-[400px]:flex-none px-4 py-2.5 font-medium transition-colors ${sortBy === 'latest'
                ? 'bg-secondary text-white'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('unanswered')}
              className={`flex-1 min-[400px]:flex-none px-4 py-2.5 font-medium transition-colors ${sortBy === 'unanswered'
                ? 'bg-secondary text-white'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              Unanswered
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`tour-filters relative flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium shadow-sm transition-all w-full min-[400px]:w-auto ${showFilters || selectedTags.length
              ? 'bg-secondary/10 border-secondary text-secondary dark:bg-secondary/20 dark:text-blue-300'
              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-secondary'
              }`}
          >
            <Filter size={16} />
            Filters
            {selectedTags.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[11px] rounded-full bg-secondary text-white font-bold">
                {selectedTags.length}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Selected tag badges (quick clear) ──── */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 animate-fade-in-up">
          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mr-1">Active filters:</span>
          {selectedTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/15 text-secondary dark:bg-secondary/25 dark:text-blue-300 text-xs font-semibold hover:bg-secondary/25 transition-colors"
            >
              {tag}
              <X size={12} />
            </button>
          ))}
          <button
            onClick={() => setSelectedTags([])}
            className="ml-1 text-xs text-red-500 dark:text-red-400 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Expandable tag filters ─────────────── */}
      {showFilters && (
        <div className="mb-6 p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm animate-fade-in-up">
          {Object.entries(groupedTags).map(([category, categoryTags]) => (
            <div key={category} className="mb-4 last:mb-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
                {categoryLabel[category] || category}
              </h4>
              <div className="flex flex-wrap gap-2">
                {categoryTags.map(tag => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    active={selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Feed ──────────────────────────────── */}
      {questions.length === 0 && loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 size={32} className="animate-spin text-secondary" />
          <span className="text-sm text-gray-400 dark:text-slate-500">Loading questions…</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Eye size={28} className="text-gray-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-1">No questions found</h3>
          <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs">
            Try adjusting your filters or search query to discover more questions.
          </p>
        </div>
      ) : (
        <Virtuoso
          useWindowScroll
          data={questions}
          endReached={() => hasMore && !isFetchingMore && handleLoadMore()}
          itemContent={(_, q) => {
            const isNew = newIds.has(q.id);

            return (
              <div className={`mb-4 relative transition-all duration-500 ${isNew ? 'animate-fade-in-up' : ''}`}>

                {/* ── NEW live badge ── */}
                {isNew && (
                  <div className="absolute -top-2 -left-2 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-bold shadow-lg shadow-emerald-500/30 animate-pulse-slow">
                    <Sparkles size={11} />
                    LIVE
                  </div>
                )}

                <div
                  onClick={() => {
                    setNewIds(prev => {
                      const next = new Set(prev);
                      next.delete(q.id);
                      return next;
                    });
                  }}
                >
                  <QuestionCard
                    question={q}
                    author={
                      q.user || {
                        id: 'unknown',
                        name: 'Anonymous',
                        role: 'student',
                        avatar: '👤'
                      }
                    }
                  />
                </div>
              </div>
            );
          }}
          components={{
            Footer: () =>
              isFetchingMore ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={24} className="animate-spin text-secondary" />
                </div>
              ) : !hasMore && questions.length > 0 ? (
                <div className="text-center py-8 text-sm text-gray-400 dark:text-slate-500">
                  You've reached the end 🎉
                </div>
              ) : null,
          }}
        />
      )}
    </div>
  );
}