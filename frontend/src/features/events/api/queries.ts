import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as eventsApi from "@/features/events/api/eventsApi";
import type { EventInput } from "@/types/events";

const eventsKey = ["events"] as const;

export function useEvents() {
  return useQuery({ queryKey: eventsKey, queryFn: eventsApi.listEvents });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventInput) => eventsApi.createEvent(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsKey }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EventInput> }) => eventsApi.updateEvent(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsKey }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventsApi.deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsKey }),
  });
}
