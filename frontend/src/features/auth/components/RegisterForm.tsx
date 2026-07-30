import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

const registerSchema = z.object({
  full_name: z.string().min(1, "Ad soyad gerekli").max(255),
  email: z.string().min(1, "E-posta gerekli").email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(128),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<void>;
  isSubmitting: boolean;
  formError?: string | null;
}

export function RegisterForm({ onSubmit, isSubmitting, formError }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        id="full_name"
        label="Ad Soyad"
        placeholder="Adınız Soyadınız"
        autoComplete="name"
        error={errors.full_name?.message}
        {...register("full_name")}
      />
      <Input
        id="email"
        type="email"
        label="E-posta"
        placeholder="ornek@eposta.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="password"
        type="password"
        label="Şifre"
        placeholder="En az 8 karakter"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {formError ? <p className="text-sm text-danger">{formError}</p> : null}
      <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full">
        Hesap Oluştur
      </Button>
    </form>
  );
}
