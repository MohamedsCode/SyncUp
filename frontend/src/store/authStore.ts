import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => {
        localStorage.setItem("syncup-token", token);
        localStorage.removeItem("syncu-token");
        set({ token, user });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem("syncup-token");
        localStorage.removeItem("syncu-token");
        set({ token: null, user: null });
      }
    }),
    {
      name: "syncup-auth"
    }
  )
);
