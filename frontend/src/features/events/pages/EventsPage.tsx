import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Etkinlikler</h1>
          <p className="text-sm text-text-muted">İş görüşmesi, düğün, toplantı gibi etkinliklerinizi planlayın.</p>
        </div>
        <Button disabled title="Faz 5'te aktif olacak">
          <Plus size={16} />
          Etkinlik Ekle
        </Button>
      </div>

      <EmptyState
        icon={<CalendarDays size={22} />}
        title="Planlanmış bir etkinliğiniz yok"
        description="Bu özellik Faz 5'te aktif olacak."
      />
    </div>
  );
}
