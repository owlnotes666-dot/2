"use client";

import { useEffect } from "react";
import type { KnowledgeArticleWithCategory } from "../types/knowledgeBase.types";

interface KnowledgeArticleDetailsModalProps {
  article: KnowledgeArticleWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function KnowledgeArticleDetailsModal({
  article,
  isOpen,
  onClose,
}: KnowledgeArticleDetailsModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-title"
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-gray-800">
          <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
            {article.category?.name ?? "Knowledge Base"}
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close article"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto">
          {article.cover_image_url && (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-56 w-full object-cover sm:h-72"
            />
          )}

          <div className="p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
              <span>{article.read_time_minutes} min read</span>
              <span>•</span>
              <span>
                {new Date(article.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <h2
              id="article-title"
              className="mb-4 text-2xl font-bold leading-tight text-slate-900 dark:text-white sm:text-3xl"
            >
              {article.title}
            </h2>

            {article.summary && (
              <p className="mb-6 border-l-4 border-teal-500 pl-4 text-base leading-7 text-slate-600 dark:text-gray-300">
                {article.summary}
              </p>
            )}

            <div className="whitespace-pre-wrap text-sm leading-8 text-slate-700 dark:text-gray-300 sm:text-base">
              {article.content}
            </div>

            {article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-200 pt-6 dark:border-gray-800">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700"
          >
            Close Article
          </button>
        </div>
      </div>
    </div>
  );
}
