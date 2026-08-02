import { useState } from "react";
import { LogOut, Mail, KeyRound, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import {
  updateProfileRequest,
  changeEmailRequest,
  changePasswordRequest,
} from "@/features/auth/api/authApi";
import { UpdateNameForm, type UpdateNameFormValues } from "@/features/auth/components/UpdateNameForm";
import { ChangeEmailForm, type ChangeEmailFormValues } from "@/features/auth/components/ChangeEmailForm";
import { ChangePasswordForm, type ChangePasswordFormValues } from "@/features/auth/components/ChangePasswordForm";
import { Card } from "@/shared/ui/Card";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { getApiErrorMessage } from "@/lib/errors";

function useFormFeedback() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clear() {
    setError(null);
    setSuccess(null);
  }

  return { error, setError, success, setSuccess, isSubmitting, setIsSubmitting, clear };
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useLogout();

  const nameFeedback = useFormFeedback();
  const emailFeedback = useFormFeedback();
  const passwordFeedback = useFormFeedback();

  if (!user) return null;

  async function handleUpdateName(values: UpdateNameFormValues) {
    nameFeedback.clear();
    nameFeedback.setIsSubmitting(true);
    try {
      const updated = await updateProfileRequest(values);
      updateUser(updated);
      nameFeedback.setSuccess("Ad soyad güncellendi.");
    } catch (error) {
      nameFeedback.setError(getApiErrorMessage(error, "Ad soyad güncellenemedi"));
    } finally {
      nameFeedback.setIsSubmitting(false);
    }
  }

  async function handleChangeEmail(values: ChangeEmailFormValues, resetForm: () => void) {
    emailFeedback.clear();
    emailFeedback.setIsSubmitting(true);
    try {
      const updated = await changeEmailRequest(values);
      updateUser(updated);
      emailFeedback.setSuccess("E-posta adresiniz güncellendi.");
      resetForm();
    } catch (error) {
      emailFeedback.setError(getApiErrorMessage(error, "E-posta güncellenemedi"));
    } finally {
      emailFeedback.setIsSubmitting(false);
    }
  }

  async function handleChangePassword(values: ChangePasswordFormValues, resetForm: () => void) {
    passwordFeedback.clear();
    passwordFeedback.setIsSubmitting(true);
    try {
      await changePasswordRequest(values);
      passwordFeedback.setSuccess("Şifreniz güncellendi.");
      resetForm();
    } catch (error) {
      passwordFeedback.setError(getApiErrorMessage(error, "Şifre güncellenemedi"));
    } finally {
      passwordFeedback.setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Profil</h1>
        <p className="text-sm text-text-muted">Hesap bilgilerinizi görüntüleyin ve güncelleyin.</p>
      </div>

      <Card className="flex items-center gap-4">
        <Avatar name={user.full_name} src={user.avatar_url} className="h-14 w-14 text-base" />
        <div>
          <p className="text-lg font-medium text-text">{user.full_name}</p>
          <p className="flex items-center gap-1.5 text-sm text-text-muted">
            <Mail size={14} /> {user.email}
          </p>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-text-muted">
          <UserIcon size={16} className="text-accent" />
          <span className="text-sm font-medium">Ad Soyad</span>
        </div>
        <UpdateNameForm
          defaultFullName={user.full_name}
          onSubmit={handleUpdateName}
          isSubmitting={nameFeedback.isSubmitting}
          formError={nameFeedback.error}
          successMessage={nameFeedback.success}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-text-muted">
          <Mail size={16} className="text-accent" />
          <span className="text-sm font-medium">E-posta Değiştir</span>
        </div>
        <ChangeEmailForm
          currentEmail={user.email}
          onSubmit={handleChangeEmail}
          isSubmitting={emailFeedback.isSubmitting}
          formError={emailFeedback.error}
          successMessage={emailFeedback.success}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-text-muted">
          <KeyRound size={16} className="text-accent" />
          <span className="text-sm font-medium">Şifre Değiştir</span>
        </div>
        <ChangePasswordForm
          onSubmit={handleChangePassword}
          isSubmitting={passwordFeedback.isSubmitting}
          formError={passwordFeedback.error}
          successMessage={passwordFeedback.success}
        />
      </Card>

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <UserIcon size={16} />
          Kullanıcı No: {user.id}
        </div>
        <Button variant="danger" size="sm" onClick={logout}>
          <LogOut size={16} />
          Çıkış Yap
        </Button>
      </Card>
    </div>
  );
}
