import { useMemo, useState } from "react";
import { Shirt, Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Modal } from "@/shared/ui/Modal";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { PhotoDropzone } from "@/features/wardrobe/components/PhotoDropzone";
import { ClothingItemForm } from "@/features/wardrobe/components/ClothingItemForm";
import { ClothingItemReviewModal } from "@/features/wardrobe/components/ClothingItemReviewModal";
import { ClothingItemCard } from "@/features/wardrobe/components/ClothingItemCard";
import { WardrobeFilters } from "@/features/wardrobe/components/WardrobeFilters";
import {
  useWardrobeItems,
  useTaxonomy,
  useAnalyzePhoto,
  useCreateClothingItem,
  useUpdateClothingItem,
  useDeleteClothingItem,
  useMarkWorn,
} from "@/features/wardrobe/api/queries";
import { getApiErrorMessage } from "@/lib/errors";
import type { AnalyzePhotoResponse, ClothingItem, ClothingItemInput, WardrobeFilterState } from "@/types/wardrobe";

type AddStep = "idle" | "upload" | "review";

const emptyFilters: WardrobeFilterState = { category: null, color: null, season: null, style: null, search: "" };

export default function WardrobePage() {
  const itemsQuery = useWardrobeItems();
  const taxonomyQuery = useTaxonomy();

  const analyzePhoto = useAnalyzePhoto();
  const createItem = useCreateClothingItem();
  const updateItem = useUpdateClothingItem();
  const deleteItem = useDeleteClothingItem();
  const markWorn = useMarkWorn();

  const [addStep, setAddStep] = useState<AddStep>("idle");
  const [analyzed, setAnalyzed] = useState<AnalyzePhotoResponse | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [deletingItem, setDeletingItem] = useState<ClothingItem | null>(null);

  const [filters, setFilters] = useState<WardrobeFilterState>(emptyFilters);

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.color && item.color !== filters.color) return false;
      if (filters.season && item.season !== filters.season) return false;
      if (filters.style && item.style !== filters.style) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = `${item.brand ?? ""} ${item.category} ${item.color}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, filters]);

  function closeAddFlow() {
    setAddStep("idle");
    setAnalyzed(null);
    setAnalyzeError(null);
    setCreateError(null);
  }

  async function handleFileSelected(file: File) {
    setAnalyzeError(null);
    try {
      const result = await analyzePhoto.mutateAsync(file);
      setAnalyzed(result);
      setAddStep("review");
    } catch (error) {
      setAnalyzeError(getApiErrorMessage(error, "Fotoğraf analiz edilemedi"));
    }
  }

  async function handleCreateSubmit(values: ClothingItemInput) {
    if (!analyzed) return;
    setCreateError(null);
    try {
      await createItem.mutateAsync({ stagingToken: analyzed.staging_token, payload: values });
      closeAddFlow();
    } catch (error) {
      setCreateError(getApiErrorMessage(error, "Kıyafet kaydedilemedi"));
    }
  }

  async function handleUpdateSubmit(values: ClothingItemInput) {
    if (!editingItem) return;
    setUpdateError(null);
    try {
      await updateItem.mutateAsync({ id: editingItem.id, payload: values });
      setEditingItem(null);
    } catch (error) {
      setUpdateError(getApiErrorMessage(error, "Değişiklikler kaydedilemedi"));
    }
  }

  function handleConfirmDelete() {
    if (!deletingItem) return;
    deleteItem.mutate(deletingItem.id, { onSuccess: () => setDeletingItem(null) });
  }

  const taxonomy = taxonomyQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Dijital Gardırop</h1>
          <p className="text-sm text-text-muted">Kıyafetlerinizi yükleyin, düzenleyin ve organize edin.</p>
        </div>
        <Button disabled={!taxonomy} onClick={() => setAddStep("upload")}>
          <Plus size={16} />
          Kıyafet Ekle
        </Button>
      </div>

      {items.length > 0 ? <WardrobeFilters items={items} filters={filters} onChange={setFilters} /> : null}

      {itemsQuery.isLoading ? (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 h-64 w-full break-inside-avoid" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Shirt size={22} />}
          title="Gardırobunuz henüz boş"
          description="İlk kıyafetinizi ekleyerek dijital gardırobunuzu oluşturmaya başlayın."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Shirt size={22} />}
          title="Sonuç bulunamadı"
          description="Filtrelerinize uyan bir kıyafet yok — farklı bir filtre deneyin."
        />
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {filteredItems.map((item) => (
            <ClothingItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setDeletingItem(item)}
              onMarkWorn={() => markWorn.mutate(item.id)}
              isMarkingWorn={markWorn.isPending && markWorn.variables === item.id}
            />
          ))}
        </div>
      )}

      {/* Single Modal spanning both add-flow steps (upload -> review): switching the
          content in place, instead of closing one Modal and mounting another, avoids two
          independently-animating AnimatePresence overlays racing on the same transition. */}
      <Modal
        open={addStep !== "idle"}
        onClose={closeAddFlow}
        title={addStep === "review" ? "Kıyafeti Onayla" : "Kıyafet Ekle"}
      >
        {addStep === "review" && analyzed && taxonomy ? (
          <ClothingItemForm
            photoUrl={analyzed.photo_url}
            taxonomy={taxonomy}
            defaultValues={{
              category: analyzed.detected.category ?? undefined,
              color: analyzed.detected.color ?? undefined,
              fabric: analyzed.detected.fabric ?? undefined,
              style: analyzed.detected.style ?? undefined,
              season: analyzed.detected.season ?? undefined,
            }}
            onSubmit={handleCreateSubmit}
            onCancel={closeAddFlow}
            isSubmitting={createItem.isPending}
            submitError={createError}
            submitLabel="Kaydet"
          />
        ) : (
          <div className="flex flex-col gap-3">
            <PhotoDropzone onFileSelected={handleFileSelected} isAnalyzing={analyzePhoto.isPending} />
            {analyzeError ? <p className="text-sm text-danger">{analyzeError}</p> : null}
          </div>
        )}
      </Modal>

      {editingItem && taxonomy ? (
        <ClothingItemReviewModal
          open
          onClose={() => setEditingItem(null)}
          photoUrl={editingItem.photo_url}
          taxonomy={taxonomy}
          defaultValues={editingItem}
          onSubmit={handleUpdateSubmit}
          isSubmitting={updateItem.isPending}
          submitError={updateError}
          title="Kıyafeti Düzenle"
          submitLabel="Güncelle"
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Kıyafeti sil"
        description="Bu kıyafeti gardırobunuzdan kalıcı olarak silmek istediğinize emin misiniz?"
        isConfirming={deleteItem.isPending}
      />
    </div>
  );
}
