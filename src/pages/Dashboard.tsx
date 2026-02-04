import { useMemo } from 'react';
import { MessageSquare, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { questions, users, currentUser } from '../mockData';
import QuestionCard from '../components/QuestionCard';
import StatsCard from '../components/StatsCard';

export default function Dashboard() {
  const myQuestions = useMemo(
    () => questions.filter((q) => q.userId === currentUser.id),
    []
  );

  const answeredQuestions = useMemo(
    () => myQuestions.filter((q) => q.status === 'answered'),
    [myQuestions]
  );

  const pendingQuestions = useMemo(
    () => myQuestions.filter((q) => q.status === 'pending'),
    [myQuestions]
  );

  const totalViews = useMemo(
    () => myQuestions.reduce((sum, q) => sum + q.views, 0),
    [myQuestions]
  );

  const stats = [
    {
      title: 'Total Questions',
      value: myQuestions.length,
      icon: MessageSquare,
      color: 'bg-secondary',
    },
    {
      title: 'Answered',
      value: answeredQuestions.length,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Pending',
      value: pendingQuestions.length,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Total Views',
      value: totalViews,
      icon: TrendingUp,
      color: 'bg-accent',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">My Dashboard</h1>
        <p className="text-gray-600 dark:text-slate-400">Track your questions and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">My Questions</h2>
          {myQuestions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-slate-400 mb-4">You haven't asked any questions yet.</p>
              <a
                href="/ask"
                className="inline-block bg-accent text-primary px-6 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                Ask Your First Question
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {myQuestions.map((question) => {
                const author = users.find((u) => u.id === question.userId)!;
                return <QuestionCard key={question.id} question={question} author={author} />;
              })}
            </div>
          )}
        </div>

        {answeredQuestions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Answered Questions
            </h2>
            <div className="space-y-4">
              {answeredQuestions.map((question) => {
                const author = users.find((u) => u.id === question.userId)!;
                return <QuestionCard key={question.id} question={question} author={author} />;
              })}
            </div>
          </div>
        )}

        {pendingQuestions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Pending Questions
            </h2>
            <div className="space-y-4">
              {pendingQuestions.map((question) => {
                const author = users.find((u) => u.id === question.userId)!;
                return <QuestionCard key={question.id} question={question} author={author} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
