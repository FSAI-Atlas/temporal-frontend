import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface Tenant {
  id: string;
  tenantId: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  isMaster: boolean;
  isAuthenticated: boolean;
  setAuth: (data: { token: string; user: User; tenant: Tenant | null; isMaster?: boolean }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      isMaster: false,
      isAuthenticated: false,
      setAuth: ({ token, user, tenant, isMaster = false }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
        set({ token, user, tenant, isMaster, isAuthenticated: true });
      },
      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        set({ token: null, user: null, tenant: null, isMaster: false, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tenant: state.tenant,
        isMaster: state.isMaster,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

