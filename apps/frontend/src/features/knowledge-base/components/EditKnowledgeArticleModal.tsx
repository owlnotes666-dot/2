"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import {
  knowledgeArticleSchema,
  type KnowledgeArticleFormValues,
} from "../schemas/knowledgeBase.schema";

import type {
  KnowledgeArticleWithCategory,
  KnowledgeCategory,
} from "../types/knowledgeBase.types";

import { useUpdateKnowledgeArticle } from "../hooks/useKnowledgeArticles";

interface EditKnowledgeArticleModalProps {
  isOpen: boolean;
  article: KnowledgeArticleWithCategory | null;
  categories: KnowledgeCategory[];
  onClose: () => void;
}

export default function EditKnowledgeArticleModal({
  isOpen,
  article,
  categories,
  onClose,
}: EditKnowledgeArticleModalProps) {
  const updateArticle = useUpdateKnowledgeArticle();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<
    z.input<typeof knowledgeArticleSchema>,
    unknown,
    KnowledgeArticleFormValues
  >({
    resolver: zodResolver(knowledgeArticleSchema),
    defaultValues: {
      title: "",
      summary: "",
      content: "",
      category_id: "",
      cover_image_url: "",
      tags: [],
      read_time_minutes: 5,
      status: "Draft",
    },
  });

  const tags = watch("tags") ?? [];

  useEffect(() => {
    if (!article || !isOpen) return;

    reset({
      title: article.title,
      summary: article.summary ?? "",
      content: article.content,
      category_id: article.category_id ?? "",
      cover_image_url: article.cover_image_url ?? "",
      tags: article.tags ?? [],
      read_time_minutes: article.read_time_minutes,
      status: article.status,
    });
  }, [article, isOpen, reset]);

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

  const handleTagsChange = (value: string) => {
    setValue(
      "tags",
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (values: KnowledgeArticleFormValues) => {
    if (!article) return;

    try {
      const result = await updateArticle.mutateAsync({
        id: article.id,
        ...values,
        cover_image_url: values.cover_image_url || null,
        previousStatus: article.status,
      });

      if (result.ingestionFailed) {
        toast.error(
          "Article updated, but AI indexing failed. Please retry indexing later.",
        );
      } else {
        toast.success(
          values.status === "Published"
            ? "Article updated and indexed successfully."
            : "Article updated successfully.",
        );
      }

      onClose();
    } catch (error) {
      console.error("Failed to update knowledge article:", error);
      toast.error("Failed to update article. Please try again.");
    }
  };

  if (!isOpen || !article) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Edit Knowledge Article
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              Update the article information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Article Title *
              </label>
              <input
                {...register("title")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Summary *
              </label>
              <textarea
                {...register("summary")}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.summary && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.summary.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Article Content *
              </label>
              <textarea
                {...register("content")}
                rows={8}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.content && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Category *
              </label>
              <select
                {...register("category_id")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Reading Time (minutes) *
              </label>
              <input
                type="number"
                min={1}
                max={120}
                {...register("read_time_minutes", {
                  valueAsNumber: true,
                })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.read_time_minutes && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.read_time_minutes.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Cover Image URL
              </label>
              <input
                {...register("cover_image_url")}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.cover_image_url && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.cover_image_url.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Tags
              </label>
              <input
                value={tags.join(", ")}
                onChange={(event) => handleTagsChange(event.target.value)}
                placeholder="Cardiology, Heart Health, Prevention"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Publication Status
              </label>
              <select
                {...register("status")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
          </div>

          {updateArticle.isError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              Failed to update article. Please try again.
            </p>
          )}

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={updateArticle.isPending}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updateArticle.isPending}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateArticle.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
