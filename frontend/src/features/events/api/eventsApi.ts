import { apiClient } from "@/lib/apiClient";
import type { Event, EventInput } from "@/types/events";

export async function listEvents() {
  const { data } = await apiClient.get<Event[]>("/events");
  return data;
}

export async function createEvent(payload: EventInput) {
  const { data } = await apiClient.post<Event>("/events", payload);
  return data;
}

export async function updateEvent(id: number, payload: Partial<EventInput>) {
  const { data } = await apiClient.patch<Event>(`/events/${id}`, payload);
  return data;
}

export async function deleteEvent(id: number) {
  await apiClient.delete(`/events/${id}`);
}
