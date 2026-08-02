import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

const schema = z
  .object({
    current_password: z.string().min(1, "Mevcut şifrenizi girin"),
    new_password: z.string().min(8, "En az 8 karakter olmalı"),
    confirm_password: z.string().min(1, "Yeni şifrenizi tekrar girin"),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm_password"],
  });

export type ChangePasswordFormValues = z.infer<typeof schema>;

interface ChangePasswordFormProps {
  onSubmit: (values: ChangePasswordFormValues, reset: () => void) => Promise<void>;
  isSubmitting: boolean;
  formError?: string | null;
  successMessage?: string | null;
}

export function ChangePasswordForm({ onSubmit, isSubmitting, formError, successMessage }: ChangePasswordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values, () => reset()))}
      className="flex flex-col gap-4"
    >
      <Input
        type="password"
        label="Mevcut Şifre"
        placeholder="••••••••"
        autoComplete="off"
        error={errors.current_password?.message}
        {...register("current_password")}
      />
      <Input
        type="password"
        label="Yeni Şifre"
        placeholder="En az 8 karakter"
        autoComplete="new-password"
        error={errors.new_password?.message}
        {...register("new_password")}
      />
      <Input
        type="password"
        label="Yeni Şifre (Tekrar)"
        placeholder="••••••••"
        autoComplete="new-password"
        error={errors.confirm_password?.message}
        {...register("confirm_password")}
      />
      {formError ? <p className="text-sm text-danger">{formError}</p> : null}
      {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          Şifreyi Güncelle
        </Button>
      </div>
    </form>
  );
}
