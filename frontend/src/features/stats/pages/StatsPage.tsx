import { BarChart3, Shirt, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { mediaUrl } from "@/lib/media";
import { useStatsOverview } from "@/features/stats/api/queries";

// recharts renders literal SVG attributes, not Tailwind classes — these mirror index.css's
// @theme tokens directly rather than resolving CSS custom properties at render time.
const CHART_COLORS = {
  accent: "#5b4fe0",
  border: "#e7e7eb",
  textMuted: "#6b6b76",
  card: "#ffffff",
};

const tickStyle = { fontSize: 12, fill: CHART_COLORS.textMuted };
const tooltipStyle = {
  background: CHART_COLORS.card,
  border: `1px solid ${CHART_COLORS.border}`,
  borderRadius: 8,
  fontSize: 13,
};

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("tr-TR", { month: "short" });
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-text">İstatistikler</h1>
      <p className="text-sm text-text-muted">Gardırop kullanım alışkanlıklarınıza dair analizler.</p>
    </div>
  );
}

export default function StatsPage() {
  const overviewQuery = useStatsOverview();
  const overview = overviewQuery.data;

  if (overviewQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!overview || overview.total_items === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <EmptyState
          icon={<BarChart3 size={22} />}
          title="Henüz gösterilecek istatistik yok"
          description="Gardırobunuza kıyafet ekledikçe buradaki grafikler dolacak."
        />
      </div>
    );
  }

  const usagePercent = Math.round(overview.usage_rate * 100);
  const monthlyChartData = overview.monthly_outfit_counts.map((entry) => ({
    ...entry,
    label: formatMonthLabel(entry.month),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-muted">
            <Shirt size={18} className="text-accent" />
            <span className="text-sm font-medium">Toplam Kıyafet</span>
          </div>
          <p className="text-3xl font-semibold text-text">{overview.total_items}</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-muted">
            <BarChart3 size={18} className="text-accent" />
            <span className="text-sm font-medium">Kullanım Oranı</span>
          </div>
          <p className="text-3xl font-semibold text-text">%{usagePercent}</p>
          <p className="text-xs text-text-subtle">
            {overview.worn_items} / {overview.total_items} parça giyildi
          </p>
        </Card>
      </div>

      {overview.color_usage.length > 0 ? (
        <Card className="flex flex-col gap-4">
          <span className="text-sm font-medium text-text-muted">Renk Dağılımı (giyilme sayısına göre)</span>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.color_usage}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                <XAxis dataKey="color" tick={tickStyle} />
                <YAxis allowDecimals={false} tick={tickStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="wear_count" name="Giyilme sayısı" fill={CHART_COLORS.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}

      <Card className="flex flex-col gap-4">
        <span className="text-sm font-medium text-text-muted">Son 6 Ayda Oluşturulan Kombin Sayısı</span>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
              <XAxis dataKey="label" tick={tickStyle} />
              <YAxis allowDecimals={false} tick={tickStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Kombin sayısı" fill={CHART_COLORS.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {overview.top_worn_items.length > 0 ? (
        <Card className="flex flex-col gap-4">
          <span className="text-sm font-medium text-text-muted">En Çok Giyilenler</span>
          <div className="flex flex-wrap gap-4">
            {overview.top_worn_items.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-1.5">
                <img
                  src={mediaUrl(item.thumbnail_url)}
                  alt={item.category}
                  className="h-20 w-20 rounded-lg border border-border object-cover"
                />
                <Badge tone="accent">{item.wear_count}x</Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {overview.insights.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <span className="text-sm font-medium text-text-muted">Akıllı Öneriler</span>
          {overview.insights.map((insight) => (
            <div key={insight} className="flex items-start gap-2 text-sm text-text">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" />
              <span>{insight}</span>
            </div>
          ))}
        </Card>
      ) : null}
    </div>
  );
}
