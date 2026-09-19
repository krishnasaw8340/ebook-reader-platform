import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore, type ThemeMode } from '../../store/theme.store';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
    variant?: 'button' | 'menu' | 'segmented';
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    variant = 'button',
    className = ''
}) => {
    const theme = useThemeStore((s) => s.theme);
    const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
    const setTheme = useThemeStore((s) => s.setTheme);
    const toggleTheme = useThemeStore((s) => s.toggleTheme);

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen]);

    // Segmented control variant
    if (variant === 'segmented') {
        const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
            { mode: 'light', label: 'Light', icon: <Sun size={14} /> },
            { mode: 'dark', label: 'Dark', icon: <Moon size={14} /> },
            { mode: 'system', label: 'System', icon: <Laptop size={14} /> }
        ];

        return (
            <div className={`${styles.segmentedGroup} ${className}`} role="radiogroup" aria-label="Theme Selection">
                {options.map((opt) => (
                    <button
                        key={opt.mode}
                        type="button"
                        role="radio"
                        aria-checked={theme === opt.mode}
                        className={`${styles.segmentedBtn} ${theme === opt.mode ? styles.segmentedBtnActive : ''}`}
                        onClick={() => setTheme(opt.mode)}
                    >
                        {opt.icon}
                        <span>{opt.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    // Menu dropdown variant
    if (variant === 'menu') {
        return (
            <div className={`${styles.menuContainer} ${className}`} ref={menuRef}>
                <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={`Current theme: ${theme}. Click to change theme.`}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={resolvedTheme}
                            initial={{ y: -8, opacity: 0, rotate: -30 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: 8, opacity: 0, rotate: 30 }}
                            transition={{ duration: 0.15 }}
                            className={styles.iconWrapper}
                        >
                            {resolvedTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        </motion.span>
                    </AnimatePresence>
                </button>

                {menuOpen && (
                    <div className={styles.themeDropdown} role="menu">
                        <button
                            type="button"
                            role="menuitem"
                            className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionActive : ''}`}
                            onClick={() => {
                                setTheme('light');
                                setMenuOpen(false);
                            }}
                        >
                            <Sun size={15} />
                            <span>Light</span>
                            {theme === 'light' && <Check size={14} style={{ marginLeft: 'auto' }} />}
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionActive : ''}`}
                            onClick={() => {
                                setTheme('dark');
                                setMenuOpen(false);
                            }}
                        >
                            <Moon size={15} />
                            <span>Dark</span>
                            {theme === 'dark' && <Check size={14} style={{ marginLeft: 'auto' }} />}
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            className={`${styles.themeOption} ${theme === 'system' ? styles.themeOptionActive : ''}`}
                            onClick={() => {
                                setTheme('system');
                                setMenuOpen(false);
                            }}
                        >
                            <Laptop size={15} />
                            <span>System</span>
                            {theme === 'system' && <Check size={14} style={{ marginLeft: 'auto' }} />}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Default fast toggle button (cycles or toggles)
    return (
        <button
            type="button"
            className={`${styles.toggleBtn} ${className}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode (Current: ${theme})`}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={resolvedTheme}
                    initial={{ y: -6, opacity: 0, rotate: -40 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 6, opacity: 0, rotate: 40 }}
                    transition={{ duration: 0.18 }}
                    className={styles.iconWrapper}
                >
                    {resolvedTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </motion.span>
            </AnimatePresence>
        </button>
    );
};
