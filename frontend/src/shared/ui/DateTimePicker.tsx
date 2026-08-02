import { useEffect, useRef, useState } from "react";
import { addDays, addMonths, format, isSameDay, isSameMonth, isValid, parse, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/ui/Button";

const VALUE_FORMAT = "yyyy-MM-dd'T'HH:mm";
const WEEKDAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const MINUTE_OPTIONS = [0, 15, 30, 45];

function parseValue(value: string): Date {
  const parsed = value ? parse(value, VALUE_FORMAT, new Date()) : new Date();
  return isValid(parsed) ? parsed : new Date();
}

interface DateTimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** Popover date+time picker — a calendar grid plus hour/minute selects, committed only via
 * the explicit "Tamam" button (clicking a day or changing the time just updates the draft,
 * clicking outside discards it) rather than a native <input type="datetime-local">, whose
 * platform picker closes/commits with no equivalent confirm step. */
export function DateTimePicker({ label, value, onChange, error }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => parseValue(value));
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(parseValue(value)));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function open() {
    const base = parseValue(value);
    setDraft(base);
    setVisibleMonth(startOfMonth(base));
    setIsOpen(true);
  }

  function commit() {
    onChange(format(draft, VALUE_FORMAT));
    setIsOpen(false);
  }

  function selectDay(day: Date) {
    setDraft((prev) => {
      const next = new Date(day);
      next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
      return next;
    });
  }

  function setHours(hours: number) {
    setDraft((prev) => {
      const next = new Date(prev);
      next.setHours(hours);
      return next;
    });
  }

  function setMinutes(minutes: number) {
    setDraft((prev) => {
      const next = new Date(prev);
      next.setMinutes(minutes);
      return next;
    });
  }

  const gridStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const displayText = value ? format(parseValue(value), "d MMMM yyyy, HH:mm", { locale: tr }) : "";

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label ? <label className="text-sm font-medium text-text-muted">{label}</label> : null}
      <button
        type="button"
        onClick={open}
        className={cn(
          "flex h-10 items-center justify-between rounded-lg border border-border bg-surface px-3 text-sm text-text",
          "outline-none transition-colors duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20",
          error && "border-danger focus:border-danger focus:ring-danger/20",
        )}
      >
        <span className={cn(!displayText && "text-text-subtle")}>{displayText || "Tarih ve saat seçin"}</span>
        <Calendar size={16} className="shrink-0 text-text-subtle" />
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {isOpen ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-soft-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
              aria-label="Önceki ay"
              className="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-text">{format(visibleMonth, "MMMM yyyy", { locale: tr })}</span>
            <button
              type="button"
              onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
              aria-label="Sonraki ay"
              className="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-text-subtle">
            {WEEKDAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const selected = isSameDay(day, draft);
              const inMonth = isSameMonth(day, visibleMonth);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors",
                    selected
                      ? "bg-accent text-white"
                      : inMonth
                        ? "text-text hover:bg-surface-hover"
                        : "text-text-subtle/50 hover:bg-surface-hover",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <span className="text-sm text-text-muted">Saat</span>
            <select
              value={draft.getHours()}
              onChange={(e) => setHours(Number(e.target.value))}
              className="h-8 rounded-lg border border-border bg-surface px-2 text-sm text-text outline-none"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="text-text-muted">:</span>
            <select
              value={draft.getMinutes()}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="h-8 rounded-lg border border-border bg-surface px-2 text-sm text-text outline-none"
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="button" size="sm" onClick={commit}>
              Tamam
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
