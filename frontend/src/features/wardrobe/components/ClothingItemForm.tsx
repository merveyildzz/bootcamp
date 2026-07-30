import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "@/shared/ui/Select";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { mediaUrl } from "@/lib/media";
import type { ClothingItemInput, Taxonomy } from "@/types/wardrobe";

const schema = z.object({
  category: z.string().min(1, "Kategori seçin"),
  color: z.string().min(1, "Renk seçin"),
  fabric: z.string().optional(),
  style: z.string().optional(),
  season: z.string().optional(),
  brand: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ClothingItemFormProps {
  photoUrl: string;
  taxonomy: Taxonomy;
  defaultValues: Partial<ClothingItemInput>;
  onSubmit: (values: ClothingItemInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

/** Pure form content — no Modal chrome of its own, so callers can host it inside
 * whichever Modal instance fits their flow (kept separate from ClothingItemReviewModal's
 * own Modal so it can also be composed as one step of a multi-step modal without a second,
 * independently-animating AnimatePresence boundary fighting the first one). */
export function ClothingItemForm({
  photoUrl,
  taxonomy,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
  submitLabel,
}: ClothingItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      category: defaultValues.category ?? "",
      color: defaultValues.color ?? "",
      fabric: defaultValues.fabric ?? "",
      style: defaultValues.style ?? "",
      season: defaultValues.season ?? "",
      brand: defaultValues.brand ?? "",
    },
  });

  async function submit(values: FormValues) {
    await onSubmit({
      category: values.category,
      color: values.color,
      fabric: values.fabric || undefined,
      style: values.style || undefined,
      season: values.season || undefined,
      brand: values.brand || undefined,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <img
        src={mediaUrl(photoUrl)}
        alt="Kıyafet önizleme"
        className="mx-auto h-48 w-48 rounded-xl border border-border object-cover"
      />

      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Kategori"
            placeholder="Seçiniz"
            options={taxonomy.category}
            error={errors.category?.message}
            {...register("category")}
          />
          <Select
            label="Renk"
            placeholder="Seçiniz"
            options={taxonomy.color}
            error={errors.color?.message}
            {...register("color")}
          />
          <Select label="Stil" placeholder="Seçiniz" options={taxonomy.style} {...register("style")} />
          <Select label="Mevsim" placeholder="Seçiniz" options={taxonomy.season} {...register("season")} />
        </div>
        <Input label="Kumaş" placeholder="örn. pamuk, deri" {...register("fabric")} />
        <Input label="Marka" placeholder="örn. Zara" {...register("brand")} />

        {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
