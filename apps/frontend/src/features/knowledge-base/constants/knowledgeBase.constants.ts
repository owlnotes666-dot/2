import type { KnowledgeArticleStatus } from "../types/knowledgeBase.types";

export const KNOWLEDGE_ARTICLE_STATUS_OPTIONS: {
  label: string;
  value: KnowledgeArticleStatus | "All";
}[] = [
  { label: "All Articles", value: "All" },
  { label: "Published", value: "Published" },
  { label: "Draft", value: "Draft" },
];

export const KNOWLEDGE_ARTICLE_STATUS_STYLES: Record<
  KnowledgeArticleStatus,
  string
> = {
  Published:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Draft: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

export const KNOWLEDGE_ARTICLES_PER_PAGE = 8;

export const DEFAULT_KNOWLEDGE_ARTICLE_STATUS: KnowledgeArticleStatus =
  "Draft";