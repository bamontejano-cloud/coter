import { create } from 'zustand';

interface NotificationState {
  count: number;
  setCount: (n: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
}));
