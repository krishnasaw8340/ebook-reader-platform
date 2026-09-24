import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronRight, User as UserIcon, Shield, KeyRound, CheckCircle2, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import styles from './Login.module.css';

type AuthMode = 'LOGIN' | 'REGISTER' | 'VERIFY_EMAIL' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, verifyEmail, resendVerificationOtp, forgotPassword, resetPassword, isLoading } = useAuth();

    const [mode, setMode] = useState<AuthMode>('LOGIN');

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [roleType, setRoleType] = useState<'USER' | 'ADMIN'>('USER');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Banner states
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isUnverifiedError, setIsUnverifiedError] = useState(false);

    const resetFeedback = () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsUnverifiedError(false);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        try {
            await login({ email, password });
            const destination = (location.state as any)?.from?.pathname || '/';
            navigate(destination, { replace: true });
        } catch (err: any) {

            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            const formattedMsg = Array.isArray(msg) ? msg.join(', ') : msg;
            setErrorMessage(formattedMsg);
            if (formattedMsg.toLowerCase().includes('verify')) {
                setIsUnverifiedError(true);
            }
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        try {
            const res = await register({
                email,
                username,
                fullName,
                password,
                roleType,
            });
            setSuccessMessage(res.message);
            setMode('VERIFY_EMAIL');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Registration failed.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        try {
            const res = await verifyEmail({ email, otp });
            setSuccessMessage(res.message + ' You can now log in.');
            setMode('LOGIN');
            setOtp('');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Email verification failed.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const handleResendOtp = async () => {
        if (!email) {
            setErrorMessage('Please enter your email address to receive a verification OTP.');
            return;
        }
        resetFeedback();
        try {
            const res = await resendVerificationOtp(email);
            setSuccessMessage(res.message);
            setMode('VERIFY_EMAIL');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to resend verification OTP.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        try {
            const res = await forgotPassword(email);
            setSuccessMessage(res.message);
            setMode('RESET_PASSWORD');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to request password reset.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        try {
            const res = await resetPassword({ email, otp, newPassword });
            setSuccessMessage(res.message + ' Please log in with your new password.');
            setMode('LOGIN');
            setPassword('');
            setOtp('');
            setNewPassword('');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Password reset failed.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    return (
        <div className={styles.login}>
            <div className={styles.backgroundGlow} />

            <div className="main-container">
                <div className={styles.loginWrapper}>
                    <motion.div
                        className={`${styles.loginCard} glass`}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                    >
                        <Breadcrumbs 
                            items={[
                                { label: 'Home', path: '/' },
                                { label: mode === 'REGISTER' ? 'Register' : mode === 'LOGIN' ? 'Sign In' : mode === 'FORGOT_PASSWORD' ? 'Forgot Password' : mode === 'RESET_PASSWORD' ? 'Reset' : 'Verify' }
                            ]} 
                            className={styles.loginBreadcrumbs}
                        />

                        {/* Header branding */}
                        <div className={styles.brand}>
                            <div className={styles.brandIcon}>黒</div>
                            <div className={styles.brandName}>
                                Kuro<span>Yomi</span>
                            </div>
                        </div>

                        {/* Mode Title & Subtext */}
                        {mode === 'LOGIN' && (
                            <>
                                <h3>Welcome Back</h3>
                                <p className={styles.subtext}>Sign in to access your manga library and coins.</p>
                            </>
                        )}
                        {mode === 'REGISTER' && (
                            <>
                                <h3>Create an Account</h3>
                                <p className={styles.subtext}>Join KuroYomi to start reading and collecting manga.</p>
                            </>
                        )}
                        {mode === 'VERIFY_EMAIL' && (
                            <>
                                <h3>Email Verification</h3>
                                <p className={styles.subtext}>Enter the 6-digit OTP code sent to <strong>{email || 'your email'}</strong></p>
                            </>
                        )}
                        {mode === 'FORGOT_PASSWORD' && (
                            <>
                                <h3>Forgot Password</h3>
                                <p className={styles.subtext}>Enter your registered email to receive a reset code.</p>
                            </>
                        )}
                        {mode === 'RESET_PASSWORD' && (
                            <>
                                <h3>Reset Password</h3>
                                <p className={styles.subtext}>Enter the 6-digit OTP code and your new password.</p>
                            </>
                        )}

                        {/* Error / Success Alerts */}
                        {errorMessage && (
                            <div className={styles.alertError}>
                                <div>{errorMessage}</div>
                                {isUnverifiedError && (
                                    <div style={{ marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={isLoading}
                                            className={styles.btnSecondary}
                                        >
                                            <Mail size={14} /> Verify Email / Send OTP
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {successMessage && (
                            <div className={styles.alertSuccess}>
                                <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                {successMessage}
                            </div>
                        )}

                        {/* Dynamic Forms */}
                        <AnimatePresence mode="wait">
                            {mode === 'LOGIN' && (
                                <motion.form
                                    key="login"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    onSubmit={handleLoginSubmit}
                                    className={styles.form}
                                >
                                    <div className={styles.inputWrapper}>
                                        <Mail size={16} className={styles.inputIcon} />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.inputWrapper}>
                                        <Lock size={16} className={styles.inputIcon} />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div
                                        className={styles.forgotPass}
                                        onClick={() => {
                                            resetFeedback();
                                            setMode('FORGOT_PASSWORD');
                                        }}
                                    >
                                        Forgot Password?
                                    </div>

                                    <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                                        {isLoading ? <div className={styles.spinner} /> : <><LogIn size={16} /> Sign In</>}
                                    </button>

                                    <div className={styles.signupNotice}>
                                        Don't have an account?{' '}
                                        <span onClick={() => { resetFeedback(); setMode('REGISTER'); }}>
                                            Sign Up <ChevronRight size={12} />
                                        </span>
                                    </div>

                                    <div className={styles.signupNotice} style={{ marginTop: '8px' }}>
                                        Have an unverified email?{' '}
                                        <span onClick={() => { resetFeedback(); setMode('VERIFY_EMAIL'); }}>
                                            Verify Email <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </motion.form>
                            )}

                            {mode === 'REGISTER' && (
                                <motion.form
                                    key="register"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    onSubmit={handleRegisterSubmit}
                                    className={styles.form}
                                >
                                    <div className={styles.inputWrapper}>
                                        <Mail size={16} className={styles.inputIcon} />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.inputWrapper}>
                                        <UserIcon size={16} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.inputWrapper}>
                                        <UserIcon size={16} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.inputWrapper}>
                                        <Lock size={16} className={styles.inputIcon} />
                                        <input
                                            type="password"
                                            placeholder="Password (min 8 characters)"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    <div className={styles.inputWrapper}>
                                        <Shield size={16} className={styles.inputIcon} />
                                        <select
                                            className={styles.selectRole}
                                            value={roleType}
                                            onChange={(e) => setRoleType(e.target.value as 'USER' | 'ADMIN')}
                                        >
                                            <option value="USER">Role: Standard Reader (USER)</option>
                                            <option value="ADMIN">Role: Creator / Admin (ADMIN)</option>
                                        </select>
                                    </div>

                                    <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                                        {isLoading ? <div className={styles.spinner} /> : 'Create Account & Send OTP'}
                                    </button>

                                    <div className={styles.signupNotice}>
                                        Already registered?{' '}
                                        <span onClick={() => { resetFeedback(); setMode('LOGIN'); }}>
                                            Sign In <ChevronRight size={12} />
                                        </span>
                                        {' or '}
                                        <span onClick={() => { resetFeedback(); setMode('VERIFY_EMAIL'); }}>
                                            Verify Email
                                        </span>
                                    </div>
                                </motion.form>
                            )}

                            {mode === 'VERIFY_EMAIL' && (
                                <motion.form
                                    key="verify-email"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onSubmit={handleVerifyEmailSubmit}
                                    className={styles.form}
                                >
                                    <div className={styles.inputWrapper}>
                                        <Mail size={16} className={styles.inputIcon} />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.inputWrapper}>
                                        <KeyRound size={16} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            placeholder="6-digit OTP code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                            maxLength={6}
                                            style={{ letterSpacing: '4px', fontWeight: 'bold', textAlign: 'center' }}
                                        />
                                    </div>

                                    <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                                        {isLoading ? <div className={styles.spinner} /> : 'Verify Email'}
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.btnSecondary}
                                        onClick={handleResendOtp}
                                        disabled={isLoading}
                                    >
                                        <RotateCw size={14} /> Resend OTP Code
                                    </button>

                                    <div className={styles.signupNotice}>
                                        Back to <span onClick={() => { resetFeedback(); setMode('LOGIN'); }}>Sign In</span>
                                    </div>
                                </motion.form>
                            )}

                            {mode === 'FORGOT_PASSWORD' && (
                                <motion.form
                                    key="forgot-password"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleForgotPasswordSubmit}
                                    className={styles.form}
                                >
                                    <div className={styles.inputWrapper}>
                                        <Mail size={16} className={styles.inputIcon} />
                                        <input
                                            type="email"
                                            placeholder="Registered Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                                        {isLoading ? <div className={styles.spinner} /> : 'Send Password Reset Code'}
                                    </button>

                                    <div className={styles.signupNotice}>
                                        Remember password?{' '}
                                        <span onClick={() => { resetFeedback(); setMode('LOGIN'); }}>Sign In</span>
                                    </div>
                                </motion.form>
                            )}

                            {mode === 'RESET_PASSWORD' && (
                                <motion.form
                                    key="reset-password"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleResetPasswordSubmit}
                                    className={styles.form}
                                >
                                    <div className={styles.inputWrapper}>
                                        <Mail size={16} className={styles.inputIcon} />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.inputWrapper}>
                                        <KeyRound size={16} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            placeholder="6-digit OTP code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                            maxLength={6}
                                            style={{ letterSpacing: '4px', fontWeight: 'bold', textAlign: 'center' }}
                                        />
                                    </div>

                                    <div className={styles.inputWrapper}>
                                        <Lock size={16} className={styles.inputIcon} />
                                        <input
                                            type="password"
                                            placeholder="New Password (min 8 characters)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                                        {isLoading ? <div className={styles.spinner} /> : 'Reset Password'}
                                    </button>

                                    <div className={styles.signupNotice}>
                                        Back to <span onClick={() => { resetFeedback(); setMode('LOGIN'); }}>Sign In</span>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
