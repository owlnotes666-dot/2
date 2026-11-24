import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/tests/utils/query-client-wrapper";

const api = vi.hoisted(() => ({
  listConversations: vi.fn(),
  getConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

vi.mock("@/features/ai-assistant/api/aiAssistantApi", () => ({
  aiAssistantApi: api,
}));

import {
  useConversation,
  useConversations,
  useDeleteConversation,
} from "@/features/ai-assistant/hooks/useConversations";

describe("conversation hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ({ children }: PropsWithChildren) => React.JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("returns conversation lists and supports disabling the query", async () => {
    const conversations = [{ id: "c-1", title: "History" }];
    api.listConversations.mockResolvedValue(conversations);
    const disabled = renderHook(() => useConversations(false), { wrapper });
    expect(disabled.result.current.conversations).toEqual([]);
    expect(api.listConversations).not.toHaveBeenCalled();

    const enabled = renderHook(() => useConversations(), { wrapper });
    await waitFor(() => expect(enabled.result.current.conversations).toEqual(conversations));
    expect(api.listConversations).toHaveBeenCalledOnce();
  });

  it("fetches a conversation only when its id and enabled state allow it", async () => {
    const conversation = { conversation: { id: "c-1" }, messages: [] };
    api.getConversation.mockResolvedValue(conversation);
    const disabled = renderHook(() => useConversation(null), { wrapper });
    expect(disabled.result.current.conversation).toBeUndefined();
    expect(api.getConversation).not.toHaveBeenCalled();

    const enabled = renderHook(() => useConversation("c-1"), { wrapper });
    await waitFor(() => expect(enabled.result.current.conversation).toEqual(conversation));
    expect(api.getConversation).toHaveBeenCalledWith("c-1");
  });

  it("optimistically removes a conversation and restores it when deletion fails", async () => {
    const conversations = [{ id: "c-1" }, { id: "c-2" }];
    queryClient.setQueryData(["ai-assistant", "conversations"], conversations);
    api.deleteConversation.mockRejectedValue(new Error("delete failed"));
    const { result } = renderHook(() => useDeleteConversation(), { wrapper });

    await act(async () => {
      await expect(result.current.deleteConversation("c-1")).rejects.toThrow("delete failed");
    });

    expect(queryClient.getQueryData(["ai-assistant", "conversations"])).toEqual(conversations);
    await waitFor(() => expect(result.current.error?.message).toBe("delete failed"));
    expect(result.current.isDeleting).toBe(false);
  });

  it("removes a deleted conversation and invalidates the list", async () => {
    queryClient.setQueryData(["ai-assistant", "conversations"], [{ id: "c-1" }]);
    api.deleteConversation.mockResolvedValue(undefined);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const remove = vi.spyOn(queryClient, "removeQueries");
    const { result } = renderHook(() => useDeleteConversation(), { wrapper });

    await act(async () => result.current.deleteConversation("c-1"));

    expect(queryClient.getQueryData(["ai-assistant", "conversations"])).toEqual([]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ai-assistant", "conversations"] });
    expect(remove).toHaveBeenCalledWith({ queryKey: ["ai-assistant", "conversations", "c-1"] });
  });
});
