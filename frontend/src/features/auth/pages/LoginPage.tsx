import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginForm, type LoginFormValues } from "@/features/auth/components/LoginForm";
import { loginRequest } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getApiErrorMessage } from "@/lib/errors";

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const data = await loginRequest(values);
      setSession(data.user, data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, "E-posta veya şifre hatalı"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-text">Giriş Yap</h1>
        <p className="text-sm text-text-muted">Gardırobunuza ve stil önerilerinize erişmek için giriş yapın.</p>
      </div>
      <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} formError={formError} />
      <p className="text-center text-sm text-text-muted">
        Hesabınız yok mu?{" "}
        <Link to="/register" className="font-medium text-accent hover:text-accent-hover">
          Kayıt olun
        </Link>
      </p>
    </div>
  );
}
