import { useMemo, useState } from "react";
import { Heart, Layers, List } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { OutfitHistoryCard } from "@/features/outfits/components/OutfitHistoryCard";
import { useOutfits, useSetOutfitFavorite, useDeleteOutfit } from "@/features/outfits/api/queries";
import type { Outfit } from "@/types/outfits";

type ViewMode = "all" | "favorites";

export default function OutfitsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const outfitsQuery = useOutfits(viewMode === "favorites");
  const setFavorite = useSetOutfitFavorite();
  const deleteOutfit = useDeleteOutfit();

  const [deletingOutfit, setDeletingOutfit] = useState<Outfit | null>(null);

  const outfits = useMemo(() => outfitsQuery.data ?? [], [outfitsQuery.data]);

  function handleConfirmDelete() {
    if (!deletingOutfit) return;
    deleteOutfit.mutate(deletingOutfit.id, { onSuccess: () => setDeletingOutfit(null) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Kombinlerim</h1>
          <p className="text-sm text-text-muted">AI Sohbet'in geçmişte önerdiği kombinleri gör, favorilerine ekle.</p>
        </div>
        <div className="flex rounded-lg border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "all" ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text"
            }`}
          >
            <List size={14} />
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setViewMode("favorites")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "favorites" ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text"
            }`}
          >
            <Heart size={14} />
            Favoriler
          </button>
        </div>
      </div>

      {outfitsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <EmptyState
          icon={<Layers size={22} />}
          title={viewMode === "favorites" ? "Henüz favori kombiniz yok" : "Henüz bir kombin geçmişiniz yok"}
          description={
            viewMode === "favorites"
              ? "Beğendiğin bir kombini kalp ikonuyla favorilere ekleyebilirsin."
              : "AI Sohbet'ten gardırobundan bir kombin istediğinde burada birikmeye başlar."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outfits.map((outfit) => (
            <OutfitHistoryCard
              key={outfit.id}
              outfit={outfit}
              onToggleFavorite={() => setFavorite.mutate({ id: outfit.id, isFavorite: !outfit.is_favorite })}
              isTogglingFavorite={setFavorite.isPending && setFavorite.variables?.id === outfit.id}
              onDelete={() => setDeletingOutfit(outfit)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingOutfit)}
        onClose={() => setDeletingOutfit(null)}
        onConfirm={handleConfirmDelete}
        title="Kombini sil"
        description="Bu kombini kalıcı olarak silmek istediğinize emin misiniz?"
        isConfirming={deleteOutfit.isPending}
      />
    </div>
  );
}
