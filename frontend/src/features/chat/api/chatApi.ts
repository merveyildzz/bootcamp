import { apiClient } from "@/lib/apiClient";
import type { ChatMessage, Conversation } from "@/types/chat";
import type { WeatherLocation } from "@/types/weather";

export async function listConversations() {
  const { data } = await apiClient.get<Conversation[]>("/chat/conversations");
  return data;
}

export async function createConversation() {
  const { data } = await apiClient.post<Conversation>("/chat/conversations");
  return data;
}

export async function deleteConversation(id: number) {
  await apiClient.delete(`/chat/conversations/${id}`);
}

export async function listMessages(conversationId: number) {
  const { data } = await apiClient.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
  return data;
}

export async function sendMessage(conversationId: number, content: string, location: WeatherLocation | null) {
  const locationFields = location ? ("lat" in location ? { lat: location.lat, lon: location.lon } : { city: location.city }) : {};
  const { data } = await apiClient.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
    content,
    ...locationFields,
  });
  return data;
}
