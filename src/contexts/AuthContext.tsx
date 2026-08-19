import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import type {
    LoginPayload,
    RegisterPayload,
    VerifyEmailPayload,
    ResetPasswordPayload,
    JwtUser,
} from '../services/authApi';

export interface AuthContextType {
    user: JwtUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (payload: LoginPayload) => Promise<JwtUser>;
    register: (payload: RegisterPayload) => Promise<{ message: string; email: string }>;
    verifyEmail: (payload: VerifyEmailPayload) => Promise<{ message: string }>;
    resendVerificationOtp: (email: string) => Promise<{ message: string }>;
    forgotPassword: (email: string) => Promise<{ message: string }>;
    resetPassword: (payload: ResetPasswordPayload) => Promise<{ message: string }>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    clearError: () => void;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initAuth = useAuthStore((s) => s.initAuth);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    return <>{children}</>;
};

export const useAuth = () => {
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const refreshToken = useAuthStore((s) => s.refreshToken);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isLoading = useAuthStore((s) => s.isLoading);
    const login = useAuthStore((s) => s.login);
    const register = useAuthStore((s) => s.register);
    const verifyEmail = useAuthStore((s) => s.verifyEmail);
    const resendVerificationOtp = useAuthStore((s) => s.resendVerificationOtp);
    const forgotPassword = useAuthStore((s) => s.forgotPassword);
    const resetPassword = useAuthStore((s) => s.resetPassword);
    const logout = useAuthStore((s) => s.logout);
    const logoutAll = useAuthStore((s) => s.logoutAll);
    const isAdmin = user?.roles?.some((r) => r?.toUpperCase() === 'ADMIN') ?? false;

    return {
        user,
        accessToken,
        refreshToken,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        register,
        verifyEmail,
        resendVerificationOtp,
        forgotPassword,
        resetPassword,
        logout,
        logoutAll,
        clearError: () => {},
    };
};
