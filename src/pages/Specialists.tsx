import { CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { users } from "../mockData";

export default function Specialists() {
  const [selectedProfession, setSelectedProfession] = useState<string>("all");

  // Get only specialists
  const specialists = useMemo(
    () => users.filter((u) => u.role === "specialist"),
    []
  );

  // Extract professions safely (remove undefined/null)
  const professions = useMemo(() => {
    const uniqueProfessions = specialists
      .map((s) => s.profession)
      .filter((p): p is string => Boolean(p));

    return ["all", ...new Set(uniqueProfessions)];
  }, [specialists]);

  // Filter specialists safely
  const filteredSpecialists =
    selectedProfession === "all"
      ? specialists
      : specialists.filter(
          (s) => s.profession === selectedProfession
        );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          Our Specialists
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Verified professionals authorized to answer questions
        </p>
      </div>

      {/* Profession Filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        {professions.map((profession) => (
          <button
            key={profession}
            onClick={() => setSelectedProfession(profession)}
            className={`px-4 py-2 rounded-lg capitalize transition ${
              selectedProfession === profession
                ? "bg-accent text-primary"
                : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            {profession}
          </button>
        ))}
      </div>

      {/* Specialists Grid */}
      {filteredSpecialists.length === 0 ? (
        <div className="text-center py-16 text-gray-600 dark:text-slate-400">
          No specialists found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecialists.map((specialist) => (
            <div
              key={specialist.id}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{specialist.avatar}</span>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    {specialist.name}
                    {specialist.verified && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                  </h3>

                  {specialist.profession && (
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {specialist.profession}
                    </p>
                  )}
                </div>
              </div>

              {/* Expertise */}
              {specialist.expertise && specialist.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {specialist.expertise.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs bg-secondary/20 text-secondary rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
