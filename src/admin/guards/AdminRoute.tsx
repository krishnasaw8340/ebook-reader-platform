import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

interface AdminRouteProps {
    children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isLoading = useAuthStore((s) => s.isLoading);
    const user = useAuthStore((s) => s.user);
    const isAdmin = user?.roles?.some((r) => r?.toUpperCase() === 'ADMIN') ?? false;

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
                color: 'var(--text-secondary)',
                gap: '16px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(230, 57, 70, 0.2)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ fontSize: '14px', letterSpacing: '0.5px' }}>Verifying Administrator Credentials...</p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
                padding: '24px'
            }}>
                <div style={{
                    maxWidth: '520px',
                    width: '100%',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--border-radius)',
                    padding: '40px 32px',
                    textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                        color: '#ef4444'
                    }}>
                        <ShieldAlert size={32} />
                    </div>

                    <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                        403 - Forbidden
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                        The Admin Portal is restricted to platform administrators. Your account (<strong style={{ color: 'var(--color-text-primary)' }}>{user?.email}</strong>) has role <span style={{ color: '#f59e0b', fontWeight: 700 }}>{user?.roles?.join(', ') || 'USER'}</span> and does not have the required administrative permissions.
                    </p>

                    <div style={{
                        padding: '12px',
                        background: 'var(--color-surface-sunken)',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border-subtle)',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <Lock size={14} /> Backend authorization verified via JWT RolesGuard
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border-default)',
                                color: 'var(--color-text-primary)',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <ArrowLeft size={16} /> Return to Reader App
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                background: 'var(--primary)',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(230, 57, 70, 0.4)'
                            }}
                        >
                            <LogIn size={16} /> Switch Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
