import { createClient } from "@/lib/supabase/client";
import { apiRequest } from "@/lib/api/client";
import type {
  KnowledgeArticleWithCategory,
  KnowledgeCategory,
  CreateKnowledgeArticleInput,
  UpdateKnowledgeArticleInput,
} from "../types/knowledgeBase.types";

const supabase = createClient();

export const getKnowledgeArticles = async (): Promise<
  KnowledgeArticleWithCategory[]
> => {
  const { data, error } = await supabase
    .schema("medical")
    .from("knowledge_articles")
    .select(
      `
      *,
      category:knowledge_categories(*)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as KnowledgeArticleWithCategory[];
};

export const getKnowledgeCategories = async (): Promise<
  KnowledgeCategory[]
> => {
  const { data, error } = await supabase
    .schema("medical")
    .from("knowledge_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
};

const generateSlug = (title: string) => {
  const baseSlug = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
};

export const createKnowledgeArticle = async (
  input: CreateKnowledgeArticleInput,
) => {
  const { data, error } = await supabase
    .schema("medical")
    .from("knowledge_articles")
    .insert({
      title: input.title,
      slug: generateSlug(input.title),
      summary: input.summary || null,
      content: input.content,
      category_id: input.category_id,
      cover_image_url: input.cover_image_url || null,
      tags: input.tags,
      read_time_minutes: input.read_time_minutes,
      status: input.status,
      published_at:
        input.status === "Published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const updateKnowledgeArticle = async (
  input: UpdateKnowledgeArticleInput,
) => {
  const { id, ...article } = input;

  const { data, error } = await supabase
    .schema("medical")
    .from("knowledge_articles")
    .update({
      title: article.title,
      summary: article.summary || null,
      content: article.content,
      category_id: article.category_id,
      cover_image_url: article.cover_image_url || null,
      tags: article.tags,
      read_time_minutes: article.read_time_minutes,
      status: article.status,
      published_at:
        article.status === "Published" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const deleteKnowledgeArticle = async (id: string) => {
  const { error } = await supabase
    .schema("medical")
    .from("knowledge_articles")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const ingestKnowledgeArticle = async (
  articleId: string,
): Promise<void> => {
  await apiRequest(`/api/v1/ai-assistant/knowledge/${articleId}/ingest`, {
    method: "POST",
  });
};

export const removeKnowledgeArticleIndex = async (
  articleId: string,
): Promise<void> => {
  await apiRequest(`/api/v1/ai-assistant/knowledge/${articleId}/index`, {
    method: "DELETE",
  });
};
