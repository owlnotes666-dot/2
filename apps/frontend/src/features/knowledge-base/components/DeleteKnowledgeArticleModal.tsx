"use client";

import { useDeleteKnowledgeArticle } from "../hooks/useKnowledgeArticles";
import type { KnowledgeArticleWithCategory } from "../types/knowledgeBase.types";

interface DeleteKnowledgeArticleModalProps {
  isOpen: boolean;
  article: KnowledgeArticleWithCategory | null;
  onClose: () => void;
}

export default function DeleteKnowledgeArticleModal({
  isOpen,
  article,
  onClose,
}: DeleteKnowledgeArticleModalProps) {
  const deleteArticle = useDeleteKnowledgeArticle();

  const handleDelete = async () => {
    if (!article) return;

    try {
      await deleteArticle.mutateAsync(article.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete knowledge article:", error);
    }
  };

  if (!isOpen || !article) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleteArticle.isPending) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600 dark:bg-red-950">
          !
        </div>

        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Delete Article
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-gray-400">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-800 dark:text-white">
            {article.title}
          </span>
          ? This action cannot be undone.
        </p>

        {deleteArticle.isError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            Failed to delete article. Please try again.
          </p>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteArticle.isPending}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteArticle.isPending}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteArticle.isPending ? "Deleting..." : "Delete Article"}
          </button>
        </div>
      </div>
    </div>
  );
}
