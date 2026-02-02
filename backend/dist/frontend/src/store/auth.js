import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
    }),
    logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
    }),
    updateUser: (user) => set((state) => ({
        ...state,
        user,
    })),
}), {
    name: 'auth-storage',
    storage: createJSONStorage(() => localStorage),
}));
//# sourceMappingURL=auth.js.map