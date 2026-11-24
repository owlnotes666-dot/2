"use client";

import { useMemo, useState } from "react";
import type {
  KnowledgeArticleStatus,
  KnowledgeArticleWithCategory,
} from "../types/knowledgeBase.types";
import { useKnowledgeArticles } from "../hooks/useKnowledgeArticles";
import { useKnowledgeCategories } from "../hooks/useKnowledgeCategories";
import KnowledgeArticleCard from "./KnowledgeArticleCard";
import KnowledgeArticleFilters from "./KnowledgeArticleFilters";

interface KnowledgeArticlesListProps {
  isAdmin: boolean;
  onView: (article: KnowledgeArticleWithCategory) => void;
  onEdit?: (article: KnowledgeArticleWithCategory) => void;
  onDelete?: (article: KnowledgeArticleWithCategory) => void;
}

export default function KnowledgeArticlesList({
  isAdmin,
  onView,
  onEdit,
  onDelete,
}: KnowledgeArticlesListProps) {
  const { data: articles = [], isLoading, isError } = useKnowledgeArticles();
  const { data: categories = [] } = useKnowledgeCategories();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("All");
  const [status, setStatus] = useState<KnowledgeArticleStatus | "All">("All");

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        article.title.toLowerCase().includes(searchValue) ||
        (article.summary ?? "").toLowerCase().includes(searchValue) ||
        article.tags.some((tag) => tag.toLowerCase().includes(searchValue));

      const matchesCategory =
        categoryId === "All" || article.category_id === categoryId;

      const matchesStatus =
        !isAdmin || status === "All" || article.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [articles, search, categoryId, status, isAdmin]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950">
        Failed to load knowledge articles. Please try again.
      </div>
    );
  }

  return (
    <div>
      <KnowledgeArticleFilters
        search={search}
        categoryId={categoryId}
        status={status}
        categories={categories}
        isAdmin={isAdmin}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryId}
        onStatusChange={setStatus}
      />

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Knowledge Articles
        </h2>

        <span className="text-sm text-slate-500 dark:text-gray-400">
          {filteredArticles.length} articles found
        </span>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-base font-medium text-slate-700 dark:text-gray-200">
            No articles found
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => (
            <KnowledgeArticleCard
              key={article.id}
              article={article}
              isAdmin={isAdmin}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
