import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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
    isAuthenticated: boolean;
    isLoading: boolean;

    // Core actions
    setAuth: (user: JwtUser, accessToken: string) => void;
    setAccessToken: (token: string | null) => void;
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

export const useAuthStore = create<AuthState>()(
    devtools(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: true,

            setAuth: (user: JwtUser, accessToken: string) => {
                set({
                    user,
                    accessToken,
                    isAuthenticated: true,
                    isLoading: false,
                });
            },

            setAccessToken: (accessToken: string | null) => {
                set({
                    accessToken,
                    isAuthenticated: Boolean(accessToken && get().user),
                });
            },

            setUser: (user: JwtUser | null) => {
                set({
                    user,
                    isAuthenticated: Boolean(user && get().accessToken),
                });
            },

            clearAuth: () => {
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            logout: async () => {
                try {
                    await authApi.logout();
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
                set({ isLoading: true });
                try {
                    // 1. Attempt silent token refresh (browser auto-sends HttpOnly refresh cookie)
                    const refreshRes = await authApi.refresh();
                    const token = refreshRes.accessToken;
                    set({ accessToken: token });

                    // 2. Fetch authenticated user profile
                    const meData: any = await authApi.getMe();
                    const profile: JwtUser = {
                        userId: meData.userId || meData.id,
                        id: meData.id || meData.userId,
                        email: meData.email,
                        roles: Array.isArray(meData.roles)
                            ? meData.roles
                            : meData.role
                            ? [meData.role]
                            : ['USER'],
                        username: meData.username,
                        fullName: meData.fullName || meData.full_name,
                        avatarUrl: meData.avatarUrl || meData.avatar_url,
                        isEmailVerified: meData.isEmailVerified,
                        status: meData.status,
                    };

                    set({
                        user: profile,
                        accessToken: token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch {
                    // If no valid session / refresh cookie, initialize in unauthenticated state
                    get().clearAuth();
                }
            },

            login: async (payload: LoginPayload) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.login(payload);
                    const token = response.accessToken;
                    set({ accessToken: token });

                    // Fetch full profile / role info via /auth/me
                    let profile: JwtUser;
                    try {
                        const meData: any = await authApi.getMe();
                        profile = {
                            userId: meData.userId || meData.id || response.user?.id,
                            id: meData.id || meData.userId || response.user?.id,
                            email: meData.email || response.user?.email,
                            roles: Array.isArray(meData.roles)
                                ? meData.roles
                                : meData.role
                                ? [meData.role]
                                : ['USER'],
                            username: meData.username || response.user?.username,
                            fullName: meData.fullName || meData.full_name || response.user?.fullName,
                            avatarUrl: meData.avatarUrl || meData.avatar_url || response.user?.avatarUrl,
                            isEmailVerified: meData.isEmailVerified ?? response.user?.isEmailVerified,
                            status: meData.status || response.user?.status,
                        };
                    } catch {
                        // Fallback to basic user payload if getMe is unavailable
                        profile = {
                            userId: response.user?.id,
                            id: response.user?.id,
                            email: response.user?.email,
                            username: response.user?.username,
                            fullName: response.user?.fullName,
                            avatarUrl: response.user?.avatarUrl,
                            isEmailVerified: response.user?.isEmailVerified,
                            status: response.user?.status,
                            roles: response.user?.roles || ['USER'],
                        };
                    }

                    set({
                        user: profile,
                        accessToken: token,
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
        }),
        { name: 'AuthStore' }
    )
);

// Expose store globally on window for easy DevTools inspection & debugging
if (typeof window !== 'undefined') {
    (window as any).useAuthStore = useAuthStore;
}



