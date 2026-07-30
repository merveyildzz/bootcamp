import { Pencil, Trash2, Shirt } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { mediaUrl } from "@/lib/media";
import type { ClothingItem } from "@/types/wardrobe";

interface ClothingItemCardProps {
  item: ClothingItem;
  onEdit: () => void;
  onDelete: () => void;
  onMarkWorn: () => void;
  isMarkingWorn: boolean;
}

export function ClothingItemCard({ item, onEdit, onDelete, onMarkWorn, isMarkingWorn }: ClothingItemCardProps) {
  return (
    <Card className="mb-4 flex break-inside-avoid flex-col gap-3 p-3">
      <img
        src={mediaUrl(item.thumbnail_url)}
        alt={item.category}
        className="w-full rounded-xl border border-border object-cover"
      />

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="accent">{item.category}</Badge>
        <Badge>{item.color}</Badge>
        {item.season ? <Badge>{item.season}</Badge> : null}
      </div>

      {item.brand ? <p className="text-sm font-medium text-text">{item.brand}</p> : null}

      <p className="text-xs text-text-muted">
        {item.wear_count > 0
          ? `${item.wear_count} kez giyildi · son: ${item.last_worn_date}`
          : "Henüz giyilmedi"}
      </p>

      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="secondary" onClick={onMarkWorn} isLoading={isMarkingWorn} className="flex-1">
          <Shirt size={14} />
          Bugün giydim
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Düzenle">
          <Pencil size={14} />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Sil">
          <Trash2 size={14} className="text-danger" />
        </Button>
      </div>
    </Card>
  );
}
