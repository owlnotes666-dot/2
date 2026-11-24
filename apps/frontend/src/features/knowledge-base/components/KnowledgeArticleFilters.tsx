import type {
  KnowledgeArticleStatus,
  KnowledgeCategory,
} from "../types/knowledgeBase.types";

interface KnowledgeArticleFiltersProps {
  search: string;
  categoryId: string;
  status: KnowledgeArticleStatus | "All";
  categories: KnowledgeCategory[];
  isAdmin: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: KnowledgeArticleStatus | "All") => void;
}

export default function KnowledgeArticleFilters({
  search,
  categoryId,
  status,
  categories,
  isAdmin,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: KnowledgeArticleFiltersProps) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
            Search Articles
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title, summary or tag..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-teal-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
            Category
          </label>

          <select
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="All">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
              Article Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                onStatusChange(
                  event.target.value as KnowledgeArticleStatus | "All",
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="All">All Articles</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
