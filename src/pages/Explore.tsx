import { Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import QuestionCard from '../components/QuestionCard';
import SearchBar from '../components/SearchBar';
import TagChip from '../components/TagChip';
import { questions, tags, users } from '../mockData';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'unanswered'>('latest');
  const [showFilters, setShowFilters] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    if (searchQuery) {
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((q) =>
        q.tags.some((tag) => selectedTags.includes(tag))
      );
    }

    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'unanswered') {
      filtered = filtered.filter((q) => q.status === 'pending');
    }

    return filtered;
  }, [searchQuery, selectedTags, sortBy]);

  const groupedTags = useMemo(() => {
    const grouped: Record<string, string[]> = {
      psychology: [],
      corporate: [],
      industry: [],
    };
    tags.forEach((tag) => {
      grouped[tag.category].push(tag.name);
    });
    return grouped;
  }, []);

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
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-slate-400">No questions found matching your criteria.</p>
          </div>
        ) : (
          filteredQuestions.map((question) => {
            const author = users.find((u) => u.id === question.userId)!;
            return (
                <div key={question.id} className="mb-4">
                  <QuestionCard question={question} author={author} />
                </div>
              );
          })
        )}
      </div>
    </div>
  );
}
