import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseQueryMock } from "@/tests/utils/supabase-query-mock";

const { createClientMock, apiRequest } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  apiRequest: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: createClientMock }));
vi.mock("@/lib/api/client", () => ({ apiRequest }));

const supabase = createSupabaseQueryMock();
let service: typeof import("@/features/knowledge-base/api/knowledgeBase.service");

beforeEach(async () => {
  vi.clearAllMocks();
  supabase.setResults({ data: [], error: null });
  createClientMock.mockReturnValue(supabase.client);
  service = await import("@/features/knowledge-base/api/knowledgeBase.service");
});

describe("knowledgeBaseService", () => {
  it("loads articles and categories with empty-list fallbacks", async () => {
    supabase.setResults({ data: null, error: null });
    await expect(service.getKnowledgeArticles()).resolves.toEqual([]);
    supabase.setResults({ data: null, error: null });
    await expect(service.getKnowledgeCategories()).resolves.toEqual([]);
  });

  it("creates and updates articles with returned rows", async () => {
    const article = { id: "article-1", title: "Guide", status: "Draft" };
    supabase.setResults({ data: article, error: null });
    await expect(service.createKnowledgeArticle({
      title: "Guide", content: "Body", tags: [], status: "Draft",
    } as never)).resolves.toEqual(article);

    supabase.setResults({ data: article, error: null });
    await expect(service.updateKnowledgeArticle({
      id: "article-1", title: "Guide", content: "Body", tags: [], status: "Draft",
    } as never)).resolves.toEqual(article);
  });

  it("deletes articles and calls the ingestion endpoints", async () => {
    supabase.setResults({ data: null, error: null });
    await expect(service.deleteKnowledgeArticle("article-1")).resolves.toBeUndefined();

    apiRequest.mockResolvedValue(undefined);
    await service.ingestKnowledgeArticle("article-1");
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/ai-assistant/knowledge/article-1/ingest",
      { method: "POST" },
    );
    await service.removeKnowledgeArticleIndex("article-1");
    expect(apiRequest).toHaveBeenLastCalledWith(
      "/api/v1/ai-assistant/knowledge/article-1/index",
      { method: "DELETE" },
    );
  });

  it("propagates database failures", async () => {
    const error = new Error("database failure");
    supabase.setResults({ data: null, error });
    await expect(service.getKnowledgeCategories()).rejects.toBe(error);
  });
});
