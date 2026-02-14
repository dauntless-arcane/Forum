import { useMemo, useState } from "react";
import { currentUser, questions } from "../mockData";

export default function SpecialistDashboard() {

  const [filter, setFilter] = useState<"all" | "pending" | "answered">("pending");
  const [localQuestions, setLocalQuestions] = useState(questions);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});

  const filteredQuestions = useMemo(() => {
    if (filter === "all") return localQuestions;
    return localQuestions.filter((q) => q.status === filter);
  }, [filter, localQuestions]);

  const handleReply = (questionId: string) => {
    const content = replyContent[questionId];
    if (!content) return;

    setLocalQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...q.answers,
                {
                  id: `a-${Date.now()}`,
                  userId: currentUser.id,
                  content,
                  upvotes: 0,
                  createdAt: new Date().toISOString(),
                  isBest: false,
                },
              ],
              status: "answered",
            }
          : q
      )
    );

    setReplyContent((prev) => ({ ...prev, [questionId]: "" }));
  };

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
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === tab
                ? "bg-accent text-primary"
                : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Questions Sheet */}
      <div className="space-y-6">
        {filteredQuestions.map((q) => (
          <div
            key={q.id}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6"
          >
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
              {q.title}
            </h2>

            <p className="text-gray-600 dark:text-slate-400 mb-4">
              {q.description}
            </p>

            {/* Existing Answers */}
            {q.answers.length > 0 && (
              <div className="mb-4 space-y-2">
                {q.answers.map((a) => (
                  <div
                    key={a.id}
                    className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg text-sm"
                  >
                    {a.content}
                  </div>
                ))}
              </div>
            )}

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
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 mb-3"
            />

            <button
              onClick={() => handleReply(q.id)}
              className="bg-accent text-primary px-4 py-2 rounded-lg hover:bg-accent/90"
            >
              Submit Answer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
