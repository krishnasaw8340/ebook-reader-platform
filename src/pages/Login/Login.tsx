import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  LogIn, 
  ChevronRight, 
  User as UserIcon, 
  Shield, 
  KeyRound, 
  CheckCircle2, 
  RotateCw,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  BookOpen
} from 'lucide-react';
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
  const [rememberMe, setRememberMe] = useState(true);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // OTP Countdown timer state (seconds)
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

  // Banner states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUnverifiedError, setIsUnverifiedError] = useState(false);

  // Timer effect for OTP resend cooldown
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const resetFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUnverifiedError(false);
  };

  const handleModeChange = (newMode: AuthMode) => {
    resetFeedback();
    setMode(newMode);
    setShowPassword(false);
    setShowNewPassword(false);
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
      setSuccessMessage(res.message || 'Verification code sent to your email.');
      setOtpCountdown(60);
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
    if (otpCountdown > 0) return;

    resetFeedback();
    try {
      const res = await resendVerificationOtp(email);
      setSuccessMessage(res.message || 'A fresh 6-digit OTP code has been dispatched.');
      setOtpCountdown(60);
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
      setSuccessMessage(res.message || 'Password reset OTP code dispatched.');
      setOtpCountdown(60);
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

  const isTabMode = mode === 'LOGIN' || mode === 'REGISTER';

  return (
    <div className={styles.login}>
      <div className={styles.backgroundGlow} />

      <div className="main-container">
        <div className={styles.loginWrapper}>
          <motion.div
            className={`${styles.loginCard} glass`}
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22 }}
          >
            <Breadcrumbs 
              items={[
                { label: 'Home', path: '/' },
                { 
                  label: mode === 'REGISTER' 
                    ? 'Register' 
                    : mode === 'LOGIN' 
                    ? 'Sign In' 
                    : mode === 'FORGOT_PASSWORD' 
                    ? 'Forgot Password' 
                    : mode === 'RESET_PASSWORD' 
                    ? 'Reset Password' 
                    : 'Verify Email' 
                }
              ]} 
              className={styles.loginBreadcrumbs}
            />

            {/* Header branding */}
            <div className={styles.brand} onClick={() => navigate('/')}>
              <div className={styles.brandIcon}>黒</div>
              <div className={styles.brandName}>
                Kuro<span>Yomi</span>
              </div>
            </div>

            {/* Segmented Tab Switcher for LOGIN vs REGISTER */}
            {isTabMode && (
              <div className={styles.tabSwitcher}>
                <div 
                  className={styles.tabActivePill}
                  style={{
                    left: mode === 'LOGIN' ? '4px' : '50%',
                    width: 'calc(50% - 4px)'
                  }}
                />
                <button
                  type="button"
                  className={`${styles.tabBtn} ${mode === 'LOGIN' ? styles.tabBtnActive : ''}`}
                  onClick={() => handleModeChange('LOGIN')}
                >
                  <LogIn size={14} /> Sign In
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${mode === 'REGISTER' ? styles.tabBtnActive : ''}`}
                  onClick={() => handleModeChange('REGISTER')}
                >
                  <Sparkles size={14} /> Create Account
                </button>
              </div>
            )}

            {/* Mode Title & Subtext */}
            {mode === 'LOGIN' && (
              <>
                <h3>Welcome Back</h3>
                <p className={styles.subtext}>Sign in to access your manga library, coins, and bookmarks.</p>
              </>
            )}
            {mode === 'REGISTER' && (
              <>
                <h3>Join KuroYomi</h3>
                <p className={styles.subtext}>Create an account to read free chapters and unlock premium webtoons.</p>
              </>
            )}
            {mode === 'VERIFY_EMAIL' && (
              <>
                <h3>Email Verification</h3>
                <p className={styles.subtext}>
                  Enter the 6-digit OTP code dispatched to <strong>{email || 'your email'}</strong>
                </p>
              </>
            )}
            {mode === 'FORGOT_PASSWORD' && (
              <>
                <h3>Forgot Password</h3>
                <p className={styles.subtext}>Enter your registered email to receive a password reset code.</p>
              </>
            )}
            {mode === 'RESET_PASSWORD' && (
              <>
                <h3>Reset Password</h3>
                <p className={styles.subtext}>Enter the 6-digit OTP code and choose your new password.</p>
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
                      disabled={isLoading || otpCountdown > 0}
                      className={styles.btnSecondary}
                    >
                      <Mail size={14} /> 
                      {otpCountdown > 0 ? `Resend OTP (${otpCountdown}s)` : 'Verify Email / Send OTP'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {successMessage && (
              <div className={styles.alertSuccess}>
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {successMessage}
              </div>
            )}

            {/* Dynamic Forms */}
            <AnimatePresence mode="wait">
              {mode === 'LOGIN' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
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
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className={styles.inputTogglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className={styles.optionsRow}>
                    <label className={styles.rememberLabel}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className={styles.rememberCheckbox}
                      />
                      Remember device
                    </label>

                    <div
                      className={styles.forgotPass}
                      onClick={() => handleModeChange('FORGOT_PASSWORD')}
                    >
                      Forgot Password?
                    </div>
                  </div>

                  <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                    {isLoading ? <div className={styles.spinner} /> : <><LogIn size={16} /> Sign In</>}
                  </button>

                  <div className={styles.signupNotice}>
                    Have an unverified email?{' '}
                    <span onClick={() => handleModeChange('VERIFY_EMAIL')}>
                      Verify Email <ChevronRight size={12} />
                    </span>
                  </div>
                </motion.form>
              )}

              {mode === 'REGISTER' && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
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
                      placeholder="Username (e.g. MangaFan99)"
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
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className={styles.inputTogglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Interactive Visual Role Selector */}
                  <div className={styles.roleSelectorContainer}>
                    <label className={styles.roleLabel}>Select Account Role:</label>
                    <div className={styles.roleOptions}>
                      <div
                        className={`${styles.roleCard} ${roleType === 'USER' ? styles.roleCardActive : ''}`}
                        onClick={() => setRoleType('USER')}
                      >
                        <div className={styles.roleCardTitle}>
                          <BookOpen size={14} color="var(--color-brand-primary)" /> Reader
                        </div>
                        <div className={styles.roleCardDesc}>
                          Browse, read, and unlock manga chapters.
                        </div>
                      </div>

                      <div
                        className={`${styles.roleCard} ${roleType === 'ADMIN' ? styles.roleCardActive : ''}`}
                        onClick={() => setRoleType('ADMIN')}
                      >
                        <div className={styles.roleCardTitle}>
                          <Shield size={14} color="#3B82F6" /> Creator / Admin
                        </div>
                        <div className={styles.roleCardDesc}>
                          Publish chapters & access Creator Studio.
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                    {isLoading ? <div className={styles.spinner} /> : 'Create Account & Send OTP'}
                  </button>

                  <div className={styles.signupNotice}>
                    Already registered?{' '}
                    <span onClick={() => handleModeChange('LOGIN')}>
                      Sign In <ChevronRight size={12} />
                    </span>
                    {' or '}
                    <span onClick={() => handleModeChange('VERIFY_EMAIL')}>
                      Verify Email
                    </span>
                  </div>
                </motion.form>
              )}

              {mode === 'VERIFY_EMAIL' && (
                <motion.form
                  key="verify-email"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
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
                      onChange={(e) => setOtp(e.target.value.trim())}
                      required
                      maxLength={6}
                      style={{ letterSpacing: '6px', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}
                    />
                  </div>

                  <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                    {isLoading ? <div className={styles.spinner} /> : 'Verify Email & Proceed'}
                  </button>

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleResendOtp}
                    disabled={isLoading || otpCountdown > 0}
                  >
                    <RotateCw size={14} className={isLoading ? styles.spinner : ''} /> 
                    {otpCountdown > 0 ? `Resend OTP Code in (${otpCountdown}s)` : 'Resend OTP Code'}
                  </button>

                  <button
                    type="button"
                    className={styles.backLink}
                    onClick={() => handleModeChange('LOGIN')}
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </motion.form>
              )}

              {mode === 'FORGOT_PASSWORD' && (
                <motion.form
                  key="forgot-password"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
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

                  <button
                    type="button"
                    className={styles.backLink}
                    onClick={() => handleModeChange('LOGIN')}
                  >
                    <ArrowLeft size={14} /> Remember password? Sign In
                  </button>
                </motion.form>
              )}

              {mode === 'RESET_PASSWORD' && (
                <motion.form
                  key="reset-password"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
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
                      onChange={(e) => setOtp(e.target.value.trim())}
                      required
                      maxLength={6}
                      style={{ letterSpacing: '6px', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}
                    />
                  </div>

                  <div className={styles.inputWrapper}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="New Password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className={styles.inputTogglePassword}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                    {isLoading ? <div className={styles.spinner} /> : 'Reset Password'}
                  </button>

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleResendOtp}
                    disabled={isLoading || otpCountdown > 0}
                  >
                    <RotateCw size={14} />
                    {otpCountdown > 0 ? `Resend Code in (${otpCountdown}s)` : 'Resend Code'}
                  </button>

                  <button
                    type="button"
                    className={styles.backLink}
                    onClick={() => handleModeChange('LOGIN')}
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
