import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiAssistantApi } from "../api/aiAssistantApi";
import type { ConversationSummary } from "../types";

const conversationKeys = {
  all: ["ai-assistant", "conversations"] as const,
  detail: (id: string) => ["ai-assistant", "conversations", id] as const,
};

export function useConversations(enabled = true) {
  const query = useQuery({
    queryKey: conversationKeys.all,
    queryFn: aiAssistantApi.listConversations,
    enabled,
  });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useConversation(conversationId: string | null, enabled = true) {
  const query = useQuery({
    queryKey: conversationKeys.detail(conversationId ?? ""),
    queryFn: () => aiAssistantApi.getConversation(conversationId!),
    enabled: enabled && Boolean(conversationId),
  });

  return {
    conversation: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (conversationId: string) =>
      aiAssistantApi.deleteConversation(conversationId),

    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({
        queryKey: conversationKeys.all,
      });

      const previousConversations =
        queryClient.getQueryData<ConversationSummary[]>(
          conversationKeys.all,
        );

      queryClient.setQueryData<ConversationSummary[]>(
        conversationKeys.all,
        (current) =>
          current?.filter(
            (conversation) => conversation.id !== conversationId,
          ),
      );

      return { previousConversations };
    },

    onError: (_error, _conversationId, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          conversationKeys.all,
          context.previousConversations,
        );
      }
    },

    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });

      queryClient.removeQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    },
  });

  return {
    deleteConversation: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
