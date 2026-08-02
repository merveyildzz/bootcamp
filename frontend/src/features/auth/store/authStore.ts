import { create } from "zustand";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: User, accessToken: string) => void;
  clearSession: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setSession: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  clearSession: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  // Profile edits (name/email) don't touch the access token, unlike setSession.
  updateUser: (user) => set({ user }),
}));
