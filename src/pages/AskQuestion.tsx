import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tags } from '../mockData';
import TagChip from '../components/TagChip';

export default function AskQuestion() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim() && selectedTags.length > 0) {
      alert('Question submitted successfully! (This is a demo - no backend)');
      navigate('/dashboard');
    }
  };

  const isValid = title.trim() && description.trim() && selectedTags.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Ask a Question</h1>
        <p className="text-gray-600 dark:text-slate-400">Get help from industry specialists</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Question Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., How to manage stress during final exams?"
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/50"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more details about your question..."
            rows={8}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-beige/30 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            Select Tags (at least 1)
          </label>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Psychology</h4>
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
              <h4 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Corporate</h4>
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
              <h4 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Industry</h4>
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

          {selectedTags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Selected tags:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <TagChip key={tag} tag={tag} active />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={!isValid}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              isValid
                ? 'bg-accent text-primary hover:bg-accent/90'
                : 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            Submit Question
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-beige/30 dark:border-slate-700 rounded-lg font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
