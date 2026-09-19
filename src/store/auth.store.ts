import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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

let initAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
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
                    if (initAuthPromise) {
                        return initAuthPromise;
                    }

                    initAuthPromise = (async () => {
                        try {
                            // 1. Attempt silent token refresh (browser auto-sends HttpOnly refresh cookie)
                            const refreshRes = await authApi.refresh();
                            const token = refreshRes.accessToken;
                            set({ accessToken: token, isAuthenticated: true });

                            // 2. Fetch authenticated user profile
                            let profile: JwtUser | null = get().user;
                            try {
                                const meData: any = await authApi.getMe();
                                profile = {
                                    userId: meData.userId || meData.id || profile?.userId || '',
                                    id: meData.id || meData.userId || profile?.id || '',
                                    email: meData.email || profile?.email || '',
                                    roles: Array.isArray(meData.roles)
                                        ? meData.roles
                                        : meData.role
                                        ? [meData.role]
                                        : (profile?.roles || ['USER']),
                                    username: meData.username || profile?.username,
                                    fullName: meData.fullName || meData.full_name || profile?.fullName,
                                    avatarUrl: meData.avatarUrl || meData.avatar_url || profile?.avatarUrl,
                                    isEmailVerified: meData.isEmailVerified ?? profile?.isEmailVerified,
                                    status: meData.status || profile?.status,
                                };
                            } catch {
                                // If getMe is unavailable or routes differ, fallback to refresh user or existing stored user
                                if (!profile && refreshRes.user) {
                                    profile = refreshRes.user;
                                }
                            }

                            set({
                                user: profile,
                                accessToken: token,
                                isAuthenticated: Boolean(token),
                                isLoading: false,
                            });
                        } catch (refreshErr: any) {
                            // If refresh fails with 401 (unauthorized / cookie expired / revoked), clear session
                            const isUnauthorized = refreshErr?.response?.status === 401;
                            if (isUnauthorized || !get().accessToken) {
                                get().clearAuth();
                            } else {
                                // If it's a network error or offline, retain local state
                                set({ isLoading: false });
                            }
                        }
                    })().finally(() => {
                        initAuthPromise = null;
                        set({ isLoading: false });
                    });

                    return initAuthPromise;
                },

                login: async (payload: LoginPayload) => {
                    set({ isLoading: true });
                    try {
                        const response = await authApi.login(payload);
                        const token = response.accessToken;
                        set({ accessToken: token });

                        // Fetch full profile / role info via /auth/me (or fallbacks)
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
                            // Fallback to basic user payload from login response
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
            {
                name: 'kuroyomi_auth_storage',
                partialize: (state) => ({
                    user: state.user,
                    accessToken: state.accessToken,
                    isAuthenticated: state.isAuthenticated,
                }),
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        state.isLoading = false;
                    }
                },
            }
        ),
        { name: 'AuthStore' }
    )
);

// Expose store globally on window for easy DevTools inspection & debugging
if (typeof window !== 'undefined') {
    (window as any).useAuthStore = useAuthStore;
}



