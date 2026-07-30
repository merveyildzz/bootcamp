import { Modal } from "@/shared/ui/Modal";
import { ClothingItemForm } from "@/features/wardrobe/components/ClothingItemForm";
import type { ClothingItemInput, Taxonomy } from "@/types/wardrobe";

interface ClothingItemReviewModalProps {
  open: boolean;
  onClose: () => void;
  photoUrl: string;
  taxonomy: Taxonomy;
  defaultValues: Partial<ClothingItemInput>;
  onSubmit: (values: ClothingItemInput) => Promise<void>;
  isSubmitting: boolean;
  submitError?: string | null;
  title: string;
  submitLabel: string;
}

/** Standalone edit flow only — opens/closes on its own with no sibling modal, so it's
 * safe for this to own its own Modal instance (unlike the add flow's multi-step case,
 * see WardrobePage's single shared Modal for why that one avoids nesting two of these). */
export function ClothingItemReviewModal({
  open,
  onClose,
  photoUrl,
  taxonomy,
  defaultValues,
  onSubmit,
  isSubmitting,
  submitError,
  title,
  submitLabel,
}: ClothingItemReviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <ClothingItemForm
        photoUrl={photoUrl}
        taxonomy={taxonomy}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitLabel={submitLabel}
      />
    </Modal>
  );
}
