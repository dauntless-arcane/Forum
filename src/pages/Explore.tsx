import { Filter, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import QuestionCard from '../components/QuestionCard';
import SearchBar from '../components/SearchBar';
import TagChip from '../components/TagChip';
import { questions as questionApi } from '../services/api';
import { Question } from '../types';
import { tags } from '../mockData'; // Keep tags from mock for now or fetch from API if available (API has no tags endpoint documented in provided snippets, oh wait, it does: GET /api/tags)

export default function Explore() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'unanswered'>('latest');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch questions on mount and when filters change
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const params: any = {
          search: searchQuery || undefined,
          status: sortBy === 'unanswered' ? 'pending' : undefined,
          sort: sortBy === 'latest' ? 'newest' : undefined,
          // API doesn't support array of tags, just single tag for now based on code reading?
          // Backend code: if (tag) filter.tags = tag; -> suggests single tag filter.
          // We can filter client side for multiple tags or just pass one.
          // Let's filter client side for complex tag logic if needed, or just fetch all.
          // Actually, let's fetch all (paginated) for now or pass parameters.
        };

        // If multiple tags, we might need to filter client side or make multiple requests.
        // For now let's just use the search param.

        const { data } = await questionApi.getAll(params);
        let fetchedQuestions = data.questions;

        // Client-side filtering for multiple tags if needed
        if (selectedTags.length > 0) {
          fetchedQuestions = fetchedQuestions.filter((q: Question) =>
            q.tags.some(tag => selectedTags.includes(tag))
          );
        }

        setQuestions(fetchedQuestions);
      } catch (err) {
        setError('Failed to load questions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchQuestions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, sortBy, selectedTags]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-slate-400">No questions found matching your criteria.</p>
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
      </div>
    </div>
  );
}
