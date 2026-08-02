import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Heart, Trash2 } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media";
import type { Outfit } from "@/types/outfits";

interface OutfitHistoryCardProps {
  outfit: Outfit;
  onToggleFavorite: () => void;
  onDelete: () => void;
  isTogglingFavorite?: boolean;
}

export function OutfitHistoryCard({ outfit, onToggleFavorite, onDelete, isTogglingFavorite }: OutfitHistoryCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-text-subtle">
          {format(new Date(outfit.created_at), "d MMMM yyyy", { locale: tr })}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleFavorite}
            disabled={isTogglingFavorite}
            aria-label={outfit.is_favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          >
            <Heart size={16} className={cn(outfit.is_favorite && "fill-danger text-danger")} />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Sil">
            <Trash2 size={14} className="text-danger" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {outfit.items.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-1">
            <img
              src={mediaUrl(item.thumbnail_url)}
              alt={item.category}
              className="h-20 w-20 rounded-lg border border-border object-cover"
            />
            {item.role ? <span className="text-[11px] text-text-subtle">{item.role}</span> : null}
          </div>
        ))}
      </div>

      {outfit.ai_explanation ? <p className="text-sm text-text-muted">{outfit.ai_explanation}</p> : null}
    </Card>
  );
}
