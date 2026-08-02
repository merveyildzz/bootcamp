import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "@/shared/ui/Select";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { DateTimePicker } from "@/shared/ui/DateTimePicker";
import { EVENT_TYPES } from "@/types/events";
import type { EventInput } from "@/types/events";

const schema = z.object({
  title: z.string().min(1, "Başlık girin"),
  event_type: z.string().min(1, "Tür seçin"),
  event_date: z.string().min(1, "Tarih seçin"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

/** datetime-local inputs need "yyyy-MM-ddTHH:mm" — trims the seconds/offset the API's
 * ISO datetime string carries. */
function toDatetimeLocalValue(isoDate: string | undefined) {
  if (!isoDate) return "";
  return isoDate.slice(0, 16);
}

interface EventFormProps {
  // Widened event_type to `string` (rather than reusing EventInput directly) since this
  // also needs to accept an existing Event (whose event_type is just `string` — it's echoed
  // straight back from the backend, not re-validated against the union) when editing.
  defaultValues: Partial<Omit<EventInput, "event_type">> & { event_type?: string };
  onSubmit: (values: EventInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

export function EventForm({ defaultValues, onSubmit, onCancel, isSubmitting, submitError, submitLabel }: EventFormProps) {
  const { title, event_type, event_date, location, notes } = defaultValues;

  // Memoized on the individual primitive fields (not `defaultValues` itself, which callers
  // may pass as a fresh object literal each render) — react-hook-form's `values` option
  // resyncs the whole form whenever this reference changes, so an object recreated every
  // render (e.g. from the Controller-driven DateTimePicker below causing EventForm itself
  // to re-render) would silently wipe out anything the user had already typed.
  const values = useMemo(
    () => ({
      title: title ?? "",
      event_type: event_type ?? "",
      event_date: toDatetimeLocalValue(event_date),
      location: location ?? "",
      notes: notes ?? "",
    }),
    [title, event_type, event_date, location, notes],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values,
  });

  async function submit(values: FormValues) {
    await onSubmit({
      title: values.title,
      event_type: values.event_type as EventInput["event_type"],
      event_date: values.event_date,
      location: values.location || undefined,
      notes: values.notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Input label="Başlık" placeholder="örn. İş görüşmesi" error={errors.title?.message} {...register("title")} />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Tür"
          placeholder="Seçiniz"
          options={[...EVENT_TYPES]}
          error={errors.event_type?.message}
          {...register("event_type")}
        />
        <Controller
          name="event_date"
          control={control}
          render={({ field }) => (
            <DateTimePicker
              label="Tarih ve saat"
              value={field.value}
              onChange={field.onChange}
              error={errors.event_date?.message}
            />
          )}
        />
      </div>

      <Input label="Konum" placeholder="örn. İstanbul (opsiyonel)" {...register("location")} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-text-muted">
          Notlar
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="örn. takım elbise giy (opsiyonel)"
          className="resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle outline-none transition-colors duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("notes")}
        />
      </div>

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
