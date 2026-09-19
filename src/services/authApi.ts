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
        roles?: string[];
    };
    accessToken: string;
    refreshToken?: string;
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
    id?: string;
    email: string;
    roles: string[];
    username?: string;
    fullName?: string;
    avatarUrl?: string;
    isEmailVerified?: boolean;
    status?: string;
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

    resendVerificationOtp: async (email: string) => {
        const response = await api.post<{ message: string }>('/auth/resend-verification-otp', { email });
        return response.data;
    },

    login: async (payload: LoginPayload) => {
        const response = await api.post<AuthResponse>('/auth/login', payload);
        return response.data;
    },

    refresh: async () => {
        // Browser automatically sends HttpOnly refresh-token cookie
        const response = await api.post<{ accessToken: string; user?: JwtUser }>('/auth/refresh');
        return response.data;
    },

    logout: async () => {
        // Browser automatically sends HttpOnly refresh-token cookie to be invalidated
        const response = await api.post<{ message?: string }>('/auth/logout');
        return response.data;
    },

    logoutAll: async () => {
        const response = await api.post<{ message?: string }>('/auth/logout-all');
        return response.data;
    },

    getMe: async () => {
        try {
            const response = await api.get<JwtUser>('/auth/me');
            return response.data;
        } catch (err: any) {
            // Fallback gracefully if endpoint is under /user/me or /users/me
            if (err.response?.status === 404) {
                try {
                    const fallbackRes = await api.get<JwtUser>('/user/me');
                    return fallbackRes.data;
                } catch {
                    const fallbackRes2 = await api.get<JwtUser>('/users/me');
                    return fallbackRes2.data;
                }
            }
            throw err;
        }
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

