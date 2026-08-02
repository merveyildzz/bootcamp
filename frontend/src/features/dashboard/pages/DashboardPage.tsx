import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Shirt, CalendarClock, Layers, Clock, Sparkles } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { WeatherCard } from "@/features/weather/components/WeatherCard";
import { useWardrobeItems } from "@/features/wardrobe/api/queries";
import { useEvents } from "@/features/events/api/queries";
import { useOutfits } from "@/features/outfits/api/queries";
import { mediaUrl } from "@/lib/media";

const placeholderCards = [
  { title: "Bugünkü Kombin Önerisi", icon: Sparkles, description: "AI Sohbet ile ilk kombin önerinizi oluşturun." },
  { title: "AI Önerileri", icon: Layers, description: "Zamanla gardırobunuzu tanıdıkça öneriler burada birikecek." },
];

function UpcomingEventsCard() {
  const eventsQuery = useEvents();
  const upcoming = (eventsQuery.data ?? []).filter((event) => new Date(event.event_date) >= new Date());
  const nextEvent = upcoming[0];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-text-muted">
        <CalendarClock size={18} className="text-accent" />
        <span className="text-sm font-medium">Yaklaşan Etkinlikler</span>
      </div>
      {eventsQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <Skeleton className="h-9 w-16" />
        </div>
      ) : nextEvent ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-lg font-semibold text-text">{nextEvent.title}</p>
          <p className="text-sm text-text-muted">
            {format(new Date(nextEvent.event_date), "d MMMM, HH:mm", { locale: tr })}
          </p>
          {upcoming.length > 1 ? (
            <p className="text-xs text-text-subtle">+{upcoming.length - 1} etkinlik daha</p>
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarClock size={20} />}
          title="Henüz veri yok"
          description="Yaklaşan bir etkinliğiniz yok."
          className="border-none px-0 py-6"
        />
      )}
    </Card>
  );
}

function WardrobeCountCard() {
  const itemsQuery = useWardrobeItems();
  const count = itemsQuery.data?.length ?? 0;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-text-muted">
        <Shirt size={18} className="text-accent" />
        <span className="text-sm font-medium">Dolaptaki Kıyafet Sayısı</span>
      </div>
      {itemsQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <Skeleton className="h-9 w-16" />
        </div>
      ) : count > 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-3xl font-semibold text-text">{count}</p>
          <p className="text-sm text-text-muted">kıyafet</p>
        </div>
      ) : (
        <EmptyState
          icon={<Shirt size={20} />}
          title="Henüz veri yok"
          description="Gardırobunuza henüz kıyafet eklenmedi."
          className="border-none px-0 py-6"
        />
      )}
    </Card>
  );
}

function RecentOutfitCard() {
  const outfitsQuery = useOutfits();
  const mostRecent = outfitsQuery.data?.[0];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-text-muted">
        <Clock size={18} className="text-accent" />
        <span className="text-sm font-medium">Son Kullanılan Kombin</span>
      </div>
      {outfitsQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <Skeleton className="h-9 w-16" />
        </div>
      ) : mostRecent ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <div className="flex gap-1.5">
            {mostRecent.items.slice(0, 4).map((item) => (
              <img
                key={item.id}
                src={mediaUrl(item.thumbnail_url)}
                alt={item.category}
                className="h-12 w-12 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
          <p className="text-xs text-text-subtle">
            {format(new Date(mostRecent.created_at), "d MMMM yyyy", { locale: tr })}
          </p>
        </div>
      ) : (
        <EmptyState
          icon={<Clock size={20} />}
          title="Henüz veri yok"
          description="Bir kombin oluşturduğunuzda burada görünecek."
          className="border-none px-0 py-6"
        />
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Merhaba, {user?.full_name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-text-muted">İşte bugüne genel bir bakış.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <WeatherCard />
        <WardrobeCountCard />
        <UpcomingEventsCard />
        <RecentOutfitCard />
        {placeholderCards.map(({ title, icon: Icon, description }) => (
          <Card key={title} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-text-muted">
              <Icon size={18} className="text-accent" />
              <span className="text-sm font-medium">{title}</span>
            </div>
            <EmptyState
              icon={<Icon size={20} />}
              title="Henüz veri yok"
              description={description}
              className="border-none px-0 py-6"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
