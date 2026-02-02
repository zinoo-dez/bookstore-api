import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { authResponseSchema, userSchema } from '@/lib/schemas';
import { useAuthStore } from '@/store/auth';
import { jwtDecode } from 'jwt-decode';
export const useLogin = () => {
    const queryClient = useQueryClient();
    const { login } = useAuthStore();
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/auth/login', data);
            return authResponseSchema.parse(response.data);
        },
        onSuccess: (data) => {
            try {
                const decoded = jwtDecode(data.access_token);
                const user = {
                    id: decoded.sub,
                    email: decoded.email,
                    name: decoded.email.split('@')[0],
                    role: decoded.role,
                    createdAt: new Date().toISOString(),
                };
                login(user, data.access_token);
                queryClient.invalidateQueries({ queryKey: ['user'] });
            }
            catch (error) {
                console.error('Failed to decode JWT:', error);
                throw new Error('Invalid token received');
            }
        },
    });
};
export const useRegister = () => {
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/auth/register', data);
            return userSchema.parse(response.data);
        },
    });
};
export const useLogout = () => {
    const queryClient = useQueryClient();
    const { logout } = useAuthStore();
    return useMutation({
        mutationFn: async () => {
            return Promise.resolve();
        },
        onSuccess: () => {
            logout();
            queryClient.clear();
        },
    });
};
//# sourceMappingURL=auth.js.map