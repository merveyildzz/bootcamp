import { useState } from "react";
import { addDays, addMonths, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Event } from "@/types/events";

const WEEKDAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

interface MonthCalendarProps {
  events: Event[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
}

export function MonthCalendar({ events, selectedDay, onSelectDay }: MonthCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(selectedDay ?? new Date()));

  const gridStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  function eventsOnDay(day: Date) {
    return events.filter((event) => isSameDay(new Date(event.event_date), day));
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
          aria-label="Önceki ay"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-text">{format(visibleMonth, "MMMM yyyy", { locale: tr })}</span>
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          aria-label="Sonraki ay"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-text-subtle">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = eventsOnDay(day);
          const selected = selectedDay ? isSameDay(day, selectedDay) : false;
          const inMonth = isSameMonth(day, visibleMonth);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "flex h-10 flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors",
                selected
                  ? "bg-accent text-white"
                  : inMonth
                    ? "text-text hover:bg-surface-hover"
                    : "text-text-subtle/50 hover:bg-surface-hover",
              )}
            >
              <span>{format(day, "d")}</span>
              {dayEvents.length > 0 ? (
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    selected ? "bg-white" : "bg-accent",
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
