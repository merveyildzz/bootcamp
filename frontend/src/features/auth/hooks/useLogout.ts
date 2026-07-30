import { useNavigate } from "react-router-dom";
import { logoutRequest } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/store/authStore";

export function useLogout() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);

  return async function logout() {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };
}
