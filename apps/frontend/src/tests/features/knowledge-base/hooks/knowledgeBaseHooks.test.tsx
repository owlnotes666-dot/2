import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/tests/utils/query-client-wrapper";

const api = vi.hoisted(() => ({
  getKnowledgeArticles: vi.fn(),
  getKnowledgeCategories: vi.fn(),
  createKnowledgeArticle: vi.fn(),
  updateKnowledgeArticle: vi.fn(),
  deleteKnowledgeArticle: vi.fn(),
  ingestKnowledgeArticle: vi.fn(),
  removeKnowledgeArticleIndex: vi.fn(),
}));

vi.mock("@/features/knowledge-base/api/knowledgeBase.service", () => api);

import {
  useCreateKnowledgeArticle,
  useDeleteKnowledgeArticle,
  useKnowledgeArticles,
  useUpdateKnowledgeArticle,
} from "@/features/knowledge-base/hooks/useKnowledgeArticles";
import { useKnowledgeCategories } from "@/features/knowledge-base/hooks/useKnowledgeCategories";

describe("knowledge base hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ({ children }: PropsWithChildren) => React.JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("loads articles and categories", async () => {
    api.getKnowledgeArticles.mockResolvedValue([{ id: "a-1" }]);
    api.getKnowledgeCategories.mockResolvedValue([{ id: "c-1" }]);
    const articles = renderHook(() => useKnowledgeArticles(), { wrapper });
    const categories = renderHook(() => useKnowledgeCategories(), { wrapper });

    await waitFor(() => {
      expect(articles.result.current.data).toEqual([{ id: "a-1" }]);
      expect(categories.result.current.data).toEqual([{ id: "c-1" }]);
    });
  });

  it("ingests published articles and reports ingestion failure without failing creation", async () => {
    const article = { id: "a-1", status: "Published" };
    api.createKnowledgeArticle.mockResolvedValue(article);
    api.ingestKnowledgeArticle.mockResolvedValue(undefined);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateKnowledgeArticle(), { wrapper });

    let response: unknown;
    await act(async () => { response = await result.current.mutateAsync({ title: "Guide" } as never); });

    expect(api.ingestKnowledgeArticle).toHaveBeenCalledWith("a-1");
    expect(response).toEqual({ article, ingestionFailed: false });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["knowledge-articles"] });

    api.createKnowledgeArticle.mockResolvedValueOnce(article);
    api.ingestKnowledgeArticle.mockRejectedValueOnce(new Error("ingest failed"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => { response = await result.current.mutateAsync({ title: "Another" } as never); });
    expect(response).toEqual({ article, ingestionFailed: true });
    errorLog.mockRestore();
  });

  it("updates published articles and removes the index when unpublishing", async () => {
    api.updateKnowledgeArticle.mockResolvedValue({ id: "a-1", status: "Draft" });
    api.removeKnowledgeArticleIndex.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUpdateKnowledgeArticle(), { wrapper });

    await act(async () => result.current.mutateAsync({
      id: "a-1", status: "Draft", previousStatus: "Published",
    } as never));

    expect(api.updateKnowledgeArticle).toHaveBeenCalledWith({ id: "a-1", status: "Draft" });
    expect(api.removeKnowledgeArticleIndex).toHaveBeenCalledWith("a-1");
  });

  it("deletes an article and invalidates the article list", async () => {
    api.deleteKnowledgeArticle.mockResolvedValue(undefined);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteKnowledgeArticle(), { wrapper });

    await act(async () => result.current.mutateAsync("a-1"));

    expect(api.deleteKnowledgeArticle).toHaveBeenCalledWith("a-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["knowledge-articles"] });
  });
});
