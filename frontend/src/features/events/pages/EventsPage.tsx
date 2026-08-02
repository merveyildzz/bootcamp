import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, List, Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Modal } from "@/shared/ui/Modal";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EventForm } from "@/features/events/components/EventForm";
import { EventCard } from "@/features/events/components/EventCard";
import { MonthCalendar } from "@/features/events/components/MonthCalendar";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/features/events/api/queries";
import { getApiErrorMessage } from "@/lib/errors";
import type { Event, EventInput } from "@/types/events";

type ViewMode = "list" | "calendar";

export default function EventsPage() {
  const eventsQuery = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const selectedDayEvents = useMemo(
    () => (selectedDay ? events.filter((event) => isSameDay(new Date(event.event_date), selectedDay)) : []),
    [events, selectedDay],
  );

  function openCreateModal() {
    setCreateError(null);
    setIsCreating(true);
  }

  // Memoized so its object reference is only replaced when viewMode/selectedDay actually
  // change — EventForm's react-hook-form `values` sync (see EventForm.tsx) treats ANY new
  // defaultValues reference as fresh external data and resets the form, so a plain object
  // literal recreated on every render (e.g. a background refetch of eventsQuery) would
  // silently wipe out whatever the user had already typed into the open create modal.
  const createDefaults: Partial<EventInput> = useMemo(
    () =>
      viewMode === "calendar" && selectedDay
        ? { event_date: format(new Date(selectedDay).setHours(12, 0, 0, 0), "yyyy-MM-dd'T'HH:mm") }
        : {},
    [viewMode, selectedDay],
  );

  async function handleCreateSubmit(values: EventInput) {
    setCreateError(null);
    try {
      await createEvent.mutateAsync(values);
      setIsCreating(false);
    } catch (error) {
      setCreateError(getApiErrorMessage(error, "Etkinlik kaydedilemedi"));
    }
  }

  async function handleUpdateSubmit(values: EventInput) {
    if (!editingEvent) return;
    setUpdateError(null);
    try {
      await updateEvent.mutateAsync({ id: editingEvent.id, payload: values });
      setEditingEvent(null);
    } catch (error) {
      setUpdateError(getApiErrorMessage(error, "Değişiklikler kaydedilemedi"));
    }
  }

  function handleConfirmDelete() {
    if (!deletingEvent) return;
    deleteEvent.mutate(deletingEvent.id, { onSuccess: () => setDeletingEvent(null) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Etkinlikler</h1>
          <p className="text-sm text-text-muted">İş görüşmesi, düğün, toplantı gibi etkinliklerinizi planlayın.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text"
              }`}
            >
              <List size={14} />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "calendar" ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text"
              }`}
            >
              <CalendarDays size={14} />
              Takvim
            </button>
          </div>
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Etkinlik Ekle
          </Button>
        </div>
      </div>

      {eventsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={22} />}
          title="Planlanmış bir etkinliğiniz yok"
          description="İlk etkinliğinizi ekleyerek başlayın."
        />
      ) : viewMode === "list" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => setEditingEvent(event)}
              onDelete={() => setDeletingEvent(event)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <MonthCalendar events={events} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

          {selectedDay ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-text-muted">
                {format(selectedDay, "d MMMM yyyy", { locale: tr })}
              </h2>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-text-subtle">Bu günde planlanmış bir etkinlik yok.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedDayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={() => setEditingEvent(event)}
                      onDelete={() => setDeletingEvent(event)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <Modal open={isCreating} onClose={() => setIsCreating(false)} title="Etkinlik Ekle">
        <EventForm
          defaultValues={createDefaults}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreating(false)}
          isSubmitting={createEvent.isPending}
          submitError={createError}
          submitLabel="Kaydet"
        />
      </Modal>

      <Modal open={Boolean(editingEvent)} onClose={() => setEditingEvent(null)} title="Etkinliği Düzenle">
        {editingEvent ? (
          <EventForm
            defaultValues={editingEvent}
            onSubmit={handleUpdateSubmit}
            onCancel={() => setEditingEvent(null)}
            isSubmitting={updateEvent.isPending}
            submitError={updateError}
            submitLabel="Güncelle"
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingEvent)}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleConfirmDelete}
        title="Etkinliği sil"
        description="Bu etkinliği kalıcı olarak silmek istediğinize emin misiniz?"
        isConfirming={deleteEvent.isPending}
      />
    </div>
  );
}
