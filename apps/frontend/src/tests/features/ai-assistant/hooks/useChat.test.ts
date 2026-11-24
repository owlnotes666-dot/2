import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { wrapper } from "@/tests/utils/query-client-wrapper";

const { mockSendMessage } = vi.hoisted(() => ({
  mockSendMessage: vi.fn(),
}));

vi.mock("@/features/ai-assistant/api/aiAssistantApi", () => ({
  aiAssistantApi: {
    sendMessage: mockSendMessage,
  },
}));

import { useChat } from "@/features/ai-assistant/hooks/useChat";

describe("useChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const payload = {
    message: "Hello assistant",
    conversation_id: "conversation-123",
  };

  const response = {
    conversation_id: "conversation-123",
    message: "Hello! How can I help?",
    provider: "openrouter",
    model: "test-model",
    usage: null,
    sources: [],
    web_sources: [],
  };

  it("should send a message successfully", async () => {
    mockSendMessage.mockResolvedValue(response);

    const { result } = renderHook(() => useChat(), { wrapper });

    let returnedResponse;

    await act(async () => {
      returnedResponse = await result.current.sendMessage(payload);
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(payload);
    expect(returnedResponse).toEqual(response);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should expose pending state while sending a message", async () => {
    let resolveRequest!: (value: typeof response) => void;

    mockSendMessage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      void result.current.sendMessage(payload);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolveRequest(response);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it("should expose the error when sending a message fails", async () => {
    const error = new Error("Failed to send message");

    mockSendMessage.mockRejectedValue(error);

    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await expect(result.current.sendMessage(payload)).rejects.toThrow(
        "Failed to send message",
      );
    });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });

    expect(result.current.isPending).toBe(false);
  });

 it("should reset mutation state", async () => {
  const error = new Error("Failed to send message");

  mockSendMessage.mockRejectedValue(error);

  const { result } = renderHook(() => useChat(), { wrapper });

  await act(async () => {
    await expect(
      result.current.sendMessage(payload),
    ).rejects.toThrow("Failed to send message");
  });

  await waitFor(() => {
    expect(result.current.error).toBe(error);
  });

  act(() => {
    result.current.reset();
  });

  await waitFor(() => {
    expect(result.current.error).toBeNull();
    expect(result.current.isPending).toBe(false);
  });
});

  it("should allow sending multiple messages", async () => {
    mockSendMessage.mockResolvedValueOnce(response).mockResolvedValueOnce({
      ...response,
      message: "Second response",
    });

    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage(payload);
    });

    await act(async () => {
      await result.current.sendMessage({
        message: "Second message",
        conversation_id: "conversation-123",
      });
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).toHaveBeenNthCalledWith(1, payload);
    expect(mockSendMessage).toHaveBeenNthCalledWith(2, {
      message: "Second message",
      conversation_id: "conversation-123",
    });
  });
});
