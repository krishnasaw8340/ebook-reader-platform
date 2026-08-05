import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and redirect
    navigate('/');
  };

  return (
    <div className={styles.login}>
      {/* Background Animated Gradient Overlay */}
      <div className={styles.backgroundGlow} />

      <div className="main-container">
        <div className={styles.loginWrapper}>
          <motion.div 
            className={`${styles.loginCard} glass`}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Header branding info */}
            <div className={styles.brand}>
              <div className={styles.brandIcon}>黒</div>
              <div className={styles.brandName}>Kuro<span>Yomi</span></div>
            </div>
            
            <h3>Welcome Back</h3>
            <p className={styles.subtext}>Log in to sync your coin wallet and library bookmarks.</p>

            <form onSubmit={handleSubmit} className={styles.form}>
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

              <div className={styles.forgotPass}>Forgot Password?</div>

              <button type="submit" className={styles.btnLogin}>
                <LogIn size={16} /> Sign In
              </button>
            </form>

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            {/* Sim Google log trigger */}
            <button className={styles.btnGoogle} onClick={() => navigate('/')}>
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.76 14.93 1 12 1 7.37 1 3.4 3.66 1.48 7.55l3.77 2.92C6.18 7.43 8.87 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.55z" />
                <path fill="#FBBC05" d="M5.25 14.51c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 7.01C.53 8.91 0 11.03 0 13.26c0 2.23.53 4.35 1.48 6.25l3.77-2.92c-.24-.72-.38-1.49-.38-2.29z" strokeWidth="0" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.13 0-5.82-2.39-6.77-5.43L1.48 15.83C3.4 19.72 7.37 23 12 23z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className={styles.signupNotice}>
              Don't have an account? <span>Sign Up <ChevronRight size={12} /></span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
