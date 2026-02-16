import { Filter, Loader2, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import QuestionCard from '../components/QuestionCard';
import SearchBar from '../components/SearchBar';
import TagChip from '../components/TagChip';
import { questions as questionApi } from '../services/api';
import { Question } from '../types';
import { tags } from '../mockData'; // Keep tags from mock for now or fetch from API if available (API has no tags endpoint documented in provided snippets, oh wait, it does: GET /api/tags)

import io from 'socket.io-client';

export default function Explore() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'unanswered'>('latest');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newUpdate, setNewUpdate] = useState(false);

  // Consolidated fetch function
  const fetchQuestions = async (pageNumber = 1, append = false) => {
    if (pageNumber === 1) setLoading(true);
    try {
      const params: any = {
        limit: 20,
        page: pageNumber,
        search: searchQuery || undefined,
        status: sortBy === 'unanswered' ? 'pending' : undefined,
        sort: sortBy === 'latest' ? 'newest' : undefined,
      };

      const { data: questionsData } = await questionApi.getAll(params);
      let fetchedQuestions = questionsData.questions || [];

      // Client-side tag filter (since API might not support multi-tag filtering efficiently yet, or assumes OR)
      // If API supports ?tag=A,B then use that. Here we stick to established pattern.
      if (selectedTags.length > 0) {
        fetchedQuestions = fetchedQuestions.filter((q: Question) =>
          q.tags.some(tag => selectedTags.includes(tag))
        );
      }

      if (append) {
        setQuestions(prev => [...prev, ...fetchedQuestions]);
      } else {
        setQuestions(fetchedQuestions);
      }

      setHasMore(fetchedQuestions.length === 20);

    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Socket connection
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');

    socket.on('connect', () => {
      console.log('Explore connected to socket');
      socket.emit('join_explore');
    });

    socket.on('new_question', (question: Question) => {
      // Only show new questions if no search/filters are active to strictly match "Feed" behavior
      // Or show them anyway if they match criteria. 
      // For simplicity, we just add them if we are in "latest" mode.
      if (sortBy === 'latest' && !searchQuery) {
        setQuestions(prev => [question, ...prev]);
        setNewUpdate(true);
        setTimeout(() => setNewUpdate(false), 3000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sortBy, searchQuery]);

  // Initial Fetch & Debounced Search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      fetchQuestions(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, sortBy, selectedTags]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchQuestions(nextPage, true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Group tags (still using mock tags for categories as backend tags endpoint might just return list)
  // Logic to group tags needs to be preserved or fetched.
  // Backend GET /api/tags exists? 
  // checking backend server.js -> app.use('/api/tags', tagRoutes);
  // checking backend routes/tags.js -> likely returns tags.

  // For now, let's reuse the mock tags for the UI structure to keep it simple, 
  // but eventually we should fetch them.
  const groupedTags = {
    psychology: tags.filter(t => t.category === 'psychology').map(t => t.name),
    corporate: tags.filter(t => t.category === 'corporate').map(t => t.name),
    industry: tags.filter(t => t.category === 'industry').map(t => t.name),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Explore Questions</h1>
        <p className="text-gray-600 dark:text-slate-400">Browse and search through all questions</p>
      </div>

      <div className="mb-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Filter size={18} />
          <span>Filters</span>
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'latest' | 'unanswered')}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-secondary/50"
        >
          <option value="latest">Latest</option>
          <option value="unanswered">Unanswered</option>
        </select>

        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="px-4 py-2 text-sm text-secondary dark:text-soft hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Filter by Tags</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Psychology</h4>
              <div className="flex flex-wrap gap-2">
                {groupedTags.psychology.map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    onClick={() => toggleTag(tag)}
                    active={selectedTags.includes(tag)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Corporate</h4>
              <div className="flex flex-wrap gap-2">
                {groupedTags.corporate.map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    onClick={() => toggleTag(tag)}
                    active={selectedTags.includes(tag)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Industry</h4>
              <div className="flex flex-wrap gap-2">
                {groupedTags.industry.map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    onClick={() => toggleTag(tag)}
                    active={selectedTags.includes(tag)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">

        {/* New Questions Notification */}
        {newUpdate && (
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-3 animate-bounce">
            <Bell size={20} />
            <span className="font-medium">New questions have arrived! The feed is updated.</span>
          </div>
        )}

        {questions.length === 0 && !loading ? (
          <div className="text-center py-16 text-gray-600 dark:text-slate-400">
            No questions found satisfying your criteria.
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="mb-4">
              <QuestionCard
                question={question}
                author={question.user || { id: 'unknown', name: 'Anonymous', avatar: '👤', role: 'student' }}
              />
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-center p-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && questions.length > 0 && (
          <div className="flex justify-center mt-4 pb-8">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium shadow-sm"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
