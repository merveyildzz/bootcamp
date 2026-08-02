import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Pencil, Trash2, MapPin } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/lib/cn";
import type { Event } from "@/types/events";

interface EventCardProps {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const isPast = new Date(event.event_date) < new Date();

  return (
    <Card className={cn("flex flex-col gap-3", isPast && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <Badge tone="accent">{event.event_type}</Badge>
          <p className="font-medium text-text">{event.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Düzenle">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Sil">
            <Trash2 size={14} className="text-danger" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-text-muted">
        {format(new Date(event.event_date), "d MMMM yyyy, HH:mm", { locale: tr })}
      </p>

      {event.location ? (
        <p className="flex items-center gap-1.5 text-sm text-text-muted">
          <MapPin size={14} />
          {event.location}
        </p>
      ) : null}

      {event.notes ? <p className="text-sm text-text-subtle">{event.notes}</p> : null}
    </Card>
  );
}
