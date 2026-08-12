import { api } from './api';

export interface RegisterPayload {
    email: string;
    username: string;
    fullName: string;
    password: string;
    roleType?: 'USER' | 'ADMIN';
}

export interface VerifyEmailPayload {
    email: string;
    otp: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        username?: string;
        fullName: string;
        avatarUrl?: string;
        isEmailVerified: boolean;
        status: string;
    };
    accessToken: string;
    refreshToken: string;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    email: string;
    otp: string;
    newPassword: string;
}

export interface JwtUser {
    userId: string;
    email: string;
    roles: string[];
}

export const authApi = {
    register: async (payload: RegisterPayload) => {
        const response = await api.post<{ message: string; email: string }>('/auth/register', payload);
        return response.data;
    },

    verifyEmail: async (payload: VerifyEmailPayload) => {
        const response = await api.post<{ message: string }>('/auth/verify-email', payload);
        return response.data;
    },

    login: async (payload: LoginPayload) => {
        const response = await api.post<AuthResponse>('/auth/login', payload);
        return response.data;
    },

    refresh: async (refreshToken: string) => {
        const response = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
        return response.data;
    },

    logout: async (refreshToken: string) => {
        const response = await api.post('/auth/logout', { refreshToken });
        return response.data;
    },

    logoutAll: async () => {
        const response = await api.post('/auth/logout-all');
        return response.data;
    },

    getMe: async () => {
        const response = await api.get<JwtUser>('/auth/me');
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (payload: ResetPasswordPayload) => {
        const response = await api.post<{ message: string }>('/auth/reset-password', payload);
        return response.data;
    },
};
