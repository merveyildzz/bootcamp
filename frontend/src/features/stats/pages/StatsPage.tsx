import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";

export default function StatsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">İstatistikler</h1>
        <p className="text-sm text-text-muted">Gardırop kullanım alışkanlıklarınıza dair analizler.</p>
      </div>

      <EmptyState
        icon={<BarChart3 size={22} />}
        title="Henüz gösterilecek istatistik yok"
        description="Gardırobunuzu kullanmaya başladıkça buradaki grafikler dolacak. Bu özellik Faz 7'de aktif olacak."
      />
    </div>
  );
}
