import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  role: 'therapist' | 'patient';
}

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  login: (token: string, user: PublicUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
);
