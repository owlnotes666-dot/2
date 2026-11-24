import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getKnowledgeArticles,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
  ingestKnowledgeArticle,
  removeKnowledgeArticleIndex,
} from "../api/knowledgeBase.service";
import type {
  CreateKnowledgeArticleInput,
  UpdateKnowledgeArticleInput,
} from "../types/knowledgeBase.types";

const knowledgeArticlesKey = ["knowledge-articles"];

export const useKnowledgeArticles = () => {
  return useQuery({
    queryKey: knowledgeArticlesKey,
    queryFn: getKnowledgeArticles,
  });
};

export const useCreateKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateKnowledgeArticleInput) => {
      const article = await createKnowledgeArticle(input);

      let ingestionFailed = false;

      if (article.status === "Published") {
        try {
          await ingestKnowledgeArticle(article.id);
        } catch (error) {
          console.error("Knowledge article ingestion failed:", error);
          ingestionFailed = true;
        }
      }

      return { article, ingestionFailed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeArticlesKey });
    },
  });
};

export const useUpdateKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: UpdateKnowledgeArticleInput & {
        previousStatus: "Draft" | "Published";
      },
    ) => {
      const { previousStatus, ...articleInput } = input;

      const article = await updateKnowledgeArticle(articleInput);

      let ingestionFailed = false;

      try {
        if (article.status === "Published") {
          await ingestKnowledgeArticle(article.id);
        } else if (previousStatus === "Published") {
          await removeKnowledgeArticleIndex(article.id);
        }
      } catch (error) {
        console.error("Knowledge article indexing operation failed:", error);
        ingestionFailed = true;
      }

      return { article, ingestionFailed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeArticlesKey });
    },
  });
};

export const useDeleteKnowledgeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteKnowledgeArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeArticlesKey });
    },
  });
};
