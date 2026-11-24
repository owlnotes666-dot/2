export type KnowledgeArticleStatus = "Draft" | "Published";

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  category_id: string | null;
  cover_image_url: string | null;
  tags: string[];
  read_time_minutes: number;
  status: KnowledgeArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeArticleWithCategory extends KnowledgeArticle {
  category: KnowledgeCategory | null;
}

export interface CreateKnowledgeArticleInput {
  title: string;
  summary: string;
  content: string;
  category_id: string | null;
  cover_image_url?: string | null;
  tags: string[];
  read_time_minutes: number;
  status: KnowledgeArticleStatus;
}

export interface UpdateKnowledgeArticleInput
  extends CreateKnowledgeArticleInput {
  id: string;
}

export interface CreateKnowledgeCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
}

export interface UpdateKnowledgeCategoryInput
  extends CreateKnowledgeCategoryInput {
  id: string;
}

export interface KnowledgeArticleFilters {
  search?: string;
  categoryId?: string;
  status?: KnowledgeArticleStatus | "All";
}

export type KnowledgeArticleDetails = KnowledgeArticleWithCategory