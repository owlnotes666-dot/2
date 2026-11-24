import { useMutation } from "@tanstack/react-query";

import { aiAssistantApi } from "../api/aiAssistantApi";
import type { ChatRequest } from "../types";

export function useChat() {
  const mutation = useMutation({
    mutationKey: ["ai-assistant", "chat"],
    mutationFn: (payload: ChatRequest) =>
      aiAssistantApi.sendMessage(payload),
  });

  return {
    sendMessage: mutation.mutateAsync,

    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}