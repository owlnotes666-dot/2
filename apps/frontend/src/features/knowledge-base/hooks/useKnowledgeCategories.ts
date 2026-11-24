import { useQuery } from "@tanstack/react-query";
import { getKnowledgeCategories } from "../api/knowledgeBase.service";

export const useKnowledgeCategories = () => {
  return useQuery({
    queryKey: ["knowledge-categories"],
    queryFn: getKnowledgeCategories,
  });
};