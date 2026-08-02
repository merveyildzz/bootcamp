import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as chatApi from "@/features/chat/api/chatApi";
import type { ChatMessage } from "@/types/chat";
import type { WeatherLocation } from "@/types/weather";

const conversationsKey = ["chat", "conversations"] as const;
const messagesKey = (conversationId: number) => ["chat", "conversations", conversationId, "messages"] as const;

// Stable placeholder id for the not-yet-persisted user message — negative so it can never
// collide with a real (positive, DB-assigned) message id.
const OPTIMISTIC_MESSAGE_ID = -1;

export function useConversations() {
  return useQuery({ queryKey: conversationsKey, queryFn: chatApi.listConversations });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationsKey }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.deleteConversation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationsKey }),
  });
}

export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: conversationId !== null ? messagesKey(conversationId) : ["chat", "conversations", "none"],
    queryFn: () => chatApi.listMessages(conversationId!),
    enabled: conversationId !== null,
  });
}

export function useSendMessage(conversationId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, location }: { content: string; location: WeatherLocation | null }) =>
      chatApi.sendMessage(conversationId!, content, location),
    onMutate: async ({ content }) => {
      if (conversationId === null) return undefined;
      const key = messagesKey(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(key);

      // Show the user's own message immediately instead of waiting for the AI's reply to
      // come back and refetch — the temp id gets replaced once the real list is refetched.
      const optimisticMessage: ChatMessage = {
        id: OPTIMISTIC_MESSAGE_ID,
        role: "user",
        content,
        outfit: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[]>(key, (old) => [...(old ?? []), optimisticMessage]);

      return { previousMessages };
    },
    onError: (_error, _variables, context) => {
      if (conversationId === null || !context) return;
      queryClient.setQueryData(messagesKey(conversationId), context.previousMessages);
    },
    onSuccess: () => {
      if (conversationId === null) return;
      queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationsKey });
    },
  });
}
