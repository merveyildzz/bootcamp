import { mediaUrl } from "@/lib/media";
import type { Outfit } from "@/types/chat";

export function OutfitCard({ outfit }: { outfit: Outfit }) {
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex gap-2">
        {outfit.items.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-1">
            <img
              src={mediaUrl(item.thumbnail_url)}
              alt={item.category}
              className="h-16 w-16 rounded-lg border border-border object-cover"
            />
            {item.role ? <span className="text-[11px] text-text-subtle">{item.role}</span> : null}
          </div>
        ))}
      </div>
      {outfit.ai_explanation ? <p className="text-sm text-text-muted">{outfit.ai_explanation}</p> : null}
    </div>
  );
}
