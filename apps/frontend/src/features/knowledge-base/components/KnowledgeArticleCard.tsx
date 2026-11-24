import type { KnowledgeArticleWithCategory } from "../types/knowledgeBase.types";
import { KNOWLEDGE_ARTICLE_STATUS_STYLES } from "../constants/knowledgeBase.constants";

interface KnowledgeArticleCardProps {
  article: KnowledgeArticleWithCategory;
  onView: (article: KnowledgeArticleWithCategory) => void;
  isAdmin: boolean;
  onEdit?: (article: KnowledgeArticleWithCategory) => void;
  onDelete?: (article: KnowledgeArticleWithCategory) => void;
}

export default function KnowledgeArticleCard({
  article,
  onView,
  isAdmin,
  onEdit,
  onDelete,
}: KnowledgeArticleCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      {article.cover_image_url ? (
        <div className="h-44 overflow-hidden bg-slate-100 dark:bg-gray-800">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 dark:from-teal-950 dark:to-gray-800">
          <span className="text-4xl text-teal-600">✚</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            {article.category?.name ?? "Uncategorized"}
          </span>

          {isAdmin && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                KNOWLEDGE_ARTICLE_STATUS_STYLES[article.status]
              }`}
            >
              {article.status}
            </span>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-800 dark:text-white">
          {article.title}
        </h3>

        <p className="mb-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-500 dark:text-gray-400">
          {article.summary || "No summary available."}
        </p>

        <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
          <span>{article.read_time_minutes} min read</span>
          <span>
            {new Date(article.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {article.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-gray-800 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={() => onView(article)}
            className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            Read Article
          </button>

          {isAdmin && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(article)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Edit
            </button>
          )}

          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(article)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
