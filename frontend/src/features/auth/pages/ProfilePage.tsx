import { LogOut, Mail, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { Card } from "@/shared/ui/Card";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Profil</h1>
        <p className="text-sm text-text-muted">Hesap bilgilerinizi görüntüleyin.</p>
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
