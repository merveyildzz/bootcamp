import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RegisterForm, type RegisterFormValues } from "@/features/auth/components/RegisterForm";
import { registerRequest } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getApiErrorMessage } from "@/lib/errors";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const data = await registerRequest(values);
      setSession(data.user, data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Kayıt oluşturulamadı"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-text">Style Mind'a katılın</h1>
        <p className="text-sm text-text-muted">Gardırobunuzu dijitalleştirin, kişisel stil asistanınızla tanışın.</p>
      </div>
      <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} formError={formError} />
      <p className="text-center text-sm text-text-muted">
        Zaten hesabınız var mı?{" "}
        <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
