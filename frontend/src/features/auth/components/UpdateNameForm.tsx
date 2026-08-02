import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

const schema = z.object({
  full_name: z.string().min(1, "Ad soyad girin"),
});

export type UpdateNameFormValues = z.infer<typeof schema>;

interface UpdateNameFormProps {
  defaultFullName: string;
  onSubmit: (values: UpdateNameFormValues) => Promise<void>;
  isSubmitting: boolean;
  formError?: string | null;
  successMessage?: string | null;
}

export function UpdateNameForm({ defaultFullName, onSubmit, isSubmitting, formError, successMessage }: UpdateNameFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateNameFormValues>({
    resolver: zodResolver(schema),
    values: { full_name: defaultFullName },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Ad Soyad" error={errors.full_name?.message} {...register("full_name")} />
      {formError ? <p className="text-sm text-danger">{formError}</p> : null}
      {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
