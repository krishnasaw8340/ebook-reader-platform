import { create } from 'zustand';
import {
    authApi,
    type JwtUser,
    type LoginPayload,
    type RegisterPayload,
    type VerifyEmailPayload,
    type ResetPasswordPayload
} from '../services/authApi';

export interface AuthState {
    user: JwtUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Core actions required by specification
    setAuth: (user: JwtUser, accessToken: string, refreshToken?: string | null) => void;
    setUser: (user: JwtUser | null) => void;
    clearAuth: () => void;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    isAdmin: () => boolean;

    // Authentication flow helpers
    initAuth: () => Promise<void>;
    login: (payload: LoginPayload) => Promise<JwtUser>;
    register: (payload: RegisterPayload) => Promise<{ message: string; email: string }>;
    verifyEmail: (payload: VerifyEmailPayload) => Promise<{ message: string }>;
    resendVerificationOtp: (email: string) => Promise<{ message: string }>;
    forgotPassword: (email: string) => Promise<{ message: string }>;
    resetPassword: (payload: ResetPasswordPayload) => Promise<{ message: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => {
    // Attach global listener for unauthorized event triggered by api interceptor
    if (typeof window !== 'undefined') {
        window.addEventListener('auth:unauthorized', () => {
            get().clearAuth();
        });
    }

    return {
        user: null,
        accessToken: typeof window !== 'undefined' ? localStorage.getItem('ky_access_token') : null,
        refreshToken: typeof window !== 'undefined' ? localStorage.getItem('ky_refresh_token') : null,
        isAuthenticated: false,
        isLoading: true,

        setAuth: (user: JwtUser, accessToken: string, refreshToken?: string | null) => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('ky_access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('ky_refresh_token', refreshToken);
                }
            }
            set({
                user,
                accessToken,
                refreshToken: refreshToken || get().refreshToken,
                isAuthenticated: true,
                isLoading: false,
            });
        },

        setUser: (user: JwtUser | null) => {
            set({
                user,
                isAuthenticated: !!user,
            });
        },

        clearAuth: () => {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('ky_access_token');
                localStorage.removeItem('ky_refresh_token');
            }
            set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
            });
        },

        logout: async () => {
            const storedRefresh = typeof window !== 'undefined' ? localStorage.getItem('ky_refresh_token') : null;
            try {
                if (storedRefresh) {
                    await authApi.logout(storedRefresh);
                }
            } catch {
                // Ignore API logout error on cleanup
            } finally {
                get().clearAuth();
            }
        },

        logoutAll: async () => {
            try {
                await authApi.logoutAll();
            } catch {
                // Ignore API error on cleanup
            } finally {
                get().clearAuth();
            }
        },

        isAdmin: () => {
            const state = get();
            if (!state.isAuthenticated || !state.user) return false;
            const roles = state.user.roles || [];
            return roles.some((r) => r?.toUpperCase() === 'ADMIN');
        },

        initAuth: async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('ky_access_token') : null;
            if (!token) {
                set({ isLoading: false, isAuthenticated: false, user: null });
                return;
            }
            set({ isLoading: true });
            try {
                const profile = await authApi.getMe();
                set({
                    user: profile,
                    isAuthenticated: true,
                    isLoading: false,
                    accessToken: token,
                });
            } catch {
                get().clearAuth();
            }
        },

        login: async (payload: LoginPayload) => {
            set({ isLoading: true });
            try {
                const response = await authApi.login(payload);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('ky_access_token', response.accessToken);
                    localStorage.setItem('ky_refresh_token', response.refreshToken);
                }

                // Fetch full profile / role info
                let profile: JwtUser;
                try {
                    profile = await authApi.getMe();
                } catch {
                    // Fallback to basic user payload if getMe is unavailable
                    profile = {
                        userId: response.user.id,
                        email: response.user.email,
                        roles: ['USER'],
                    };
                }

                set({
                    user: profile,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return profile;
            } catch (err) {
                set({ isLoading: false });
                throw err;
            }
        },

        register: async (payload: RegisterPayload) => {
            set({ isLoading: true });
            try {
                return await authApi.register(payload);
            } finally {
                set({ isLoading: false });
            }
        },

        verifyEmail: async (payload: VerifyEmailPayload) => {
            set({ isLoading: true });
            try {
                return await authApi.verifyEmail(payload);
            } finally {
                set({ isLoading: false });
            }
        },

        resendVerificationOtp: async (email: string) => {
            set({ isLoading: true });
            try {
                return await authApi.resendVerificationOtp(email);
            } finally {
                set({ isLoading: false });
            }
        },

        forgotPassword: async (email: string) => {
            set({ isLoading: true });
            try {
                return await authApi.forgotPassword(email);
            } finally {
                set({ isLoading: false });
            }
        },

        resetPassword: async (payload: ResetPasswordPayload) => {
            set({ isLoading: true });
            try {
                return await authApi.resetPassword(payload);
            } finally {
                set({ isLoading: false });
            }
        },
    };
});
