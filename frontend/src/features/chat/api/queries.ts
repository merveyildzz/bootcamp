import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as chatApi from "@/features/chat/api/chatApi";
import type { WeatherLocation } from "@/types/weather";

const conversationsKey = ["chat", "conversations"] as const;
const messagesKey = (conversationId: number) => ["chat", "conversations", conversationId, "messages"] as const;

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
    onSuccess: () => {
      if (conversationId === null) return;
      queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationsKey });
    },
  });
}
