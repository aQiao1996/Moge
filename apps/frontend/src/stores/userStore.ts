import { create } from 'zustand';
import { updateProfileApi, changePasswordApi } from '@/api/user.api';
import type { ProfileValues, PasswordData } from '@moge/types';

interface UserState {
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileValues) => Promise<void>;
  changePassword: (data: PasswordData) => Promise<void>;
  resetError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  loading: false,
  error: null,

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      await updateProfileApi(data);
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Update profile failed',
        loading: false,
      });
      throw error;
    }
  },

  changePassword: async (data) => {
    set({ loading: true, error: null });
    try {
      await changePasswordApi(data);
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Change password failed',
        loading: false,
      });
      throw error;
    }
  },

  resetError: () => {
    set({ error: null });
  },
}));
