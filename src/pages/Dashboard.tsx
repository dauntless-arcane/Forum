import { CheckCircle, Clock, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import StatsCard from '../components/StatsCard';
import { questions as questionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Question } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState<'all' | 'answered' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'views'>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMyQuestions = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch all questions by this user. 
        // Assuming pagination limit is high enough or we just get first page for now.
        // Ideally we'd fetch all or handle pagination, but for now getting 50 or 100 should be fine for a prototype.
        const { data } = await questionApi.getAll({ userId: user.id, limit: 100 });
        setMyQuestions(data.questions);
      } catch (err) {
        console.error('Failed to fetch dashboard questions:', err);
        setError('Failed to load your questions');
      } finally {
        setLoading(false);
      }
    };

    fetchMyQuestions();
  }, [user]);

  const answeredQuestions = myQuestions.filter((q) => q.status === 'answered');
  const pendingQuestions = myQuestions.filter((q) => q.status === 'pending');
  const totalViews = myQuestions.reduce((sum, q) => sum + q.views, 0);

  const filteredQuestions = useMemo(() => {
    let filtered = [...myQuestions];

    if (filter === 'answered') {
      filtered = filtered.filter((q) => q.status === 'answered');
    }

    if (filter === 'pending') {
      filtered = filtered.filter((q) => q.status === 'pending');
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === 'latest') {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
    }

    if (sortBy === 'views') {
      filtered.sort((a, b) => b.views - a.views);
    }

    return filtered;
  }, [myQuestions, filter, sortBy, searchQuery]);

  const stats = [
    {
      title: 'Total Questions',
      value: myQuestions.length,
      icon: MessageSquare,
      color: 'bg-secondary',
      filterValue: 'all',
    },
    {
      title: 'Answered',
      value: answeredQuestions.length,
      icon: CheckCircle,
      color: 'bg-green-500',
      filterValue: 'answered',
    },
    {
      title: 'Pending',
      value: pendingQuestions.length,
      icon: Clock,
      color: 'bg-orange-500',
      filterValue: 'pending',
    },
    {
      title: 'Total Views',
      value: totalViews,
      icon: TrendingUp,
      color: 'bg-accent',
      filterValue: 'all',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          My Dashboard
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Track your questions and activity
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.title}
            onClick={() => setFilter(stat.filterValue as any)}
            className="cursor-pointer"
          >
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg w-fit">
          {['all', 'answered', 'pending'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-md capitalize transition-all ${filter === tab
                ? 'bg-accent text-primary'
                : 'text-gray-900 dark:text-slate-100 hover:bg-accent'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search your questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="latest">Latest</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>
      </div>

      {/* Questions */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
          <p className="text-slate-400 mb-4">
            No questions found.
          </p>
          <Link
            to="/ask"
            className="inline-block bg-accent text-primary px-6 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Ask a Question
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuestions.map((question) => {
            const author = user || { id: 'unknown', name: 'You', avatar: '👤', role: 'student' as const };
            // Since we know these are OUR questions, we can use the current user as author if question.user is missing
            return (
              <QuestionCard
                key={question.id}
                question={question}
                author={question.user || author}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
