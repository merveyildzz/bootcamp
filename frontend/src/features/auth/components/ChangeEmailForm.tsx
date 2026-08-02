import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

const schema = z.object({
  new_email: z.string().min(1, "E-posta girin").email("Geçerli bir e-posta girin"),
});

export type ChangeEmailFormValues = z.infer<typeof schema>;

interface ChangeEmailFormProps {
  currentEmail: string;
  onSubmit: (values: ChangeEmailFormValues, reset: () => void) => Promise<void>;
  isSubmitting: boolean;
  formError?: string | null;
  successMessage?: string | null;
}

export function ChangeEmailForm({ currentEmail, onSubmit, isSubmitting, formError, successMessage }: ChangeEmailFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeEmailFormValues>({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values, () => reset()))}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-text-muted">
        Şu anki e-posta: <span className="font-medium text-text">{currentEmail}</span>
      </p>
      <Input
        type="email"
        label="Yeni E-posta"
        placeholder="yeni@eposta.com"
        autoComplete="off"
        error={errors.new_email?.message}
        {...register("new_email")}
      />
      {formError ? <p className="text-sm text-danger">{formError}</p> : null}
      {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          E-postayı Güncelle
        </Button>
      </div>
    </form>
  );
}
