import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeState {
    theme: ThemeMode;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
    initTheme: () => void;
}

const STORAGE_KEY = 'kuroyomi_theme_preference';

/**
 * Detects the system operating system color scheme
 */
const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Resolves the active theme (light or dark) given a ThemeMode
 */
const resolveTheme = (mode: ThemeMode): ResolvedTheme => {
    if (mode === 'system') {
        return getSystemTheme();
    }
    return mode;
};

/**
 * Applies the resolved theme to the DOM document root
 */
const applyThemeToDOM = (resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;
};

/**
 * Reads initial preference from localStorage or defaults to dark
 */
const getInitialTheme = (): ThemeMode => {
    if (typeof window === 'undefined') return 'dark';
    try {
        const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
            return saved;
        }
    } catch {
        // Fallback gracefully if localStorage is unavailable
    }
    return 'dark'; // KuroYomi defaults to dark manga aesthetic
};

let mediaQueryListenerAttached = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: getInitialTheme(),
    resolvedTheme: resolveTheme(getInitialTheme()),

    setTheme: (theme: ThemeMode) => {
        const resolved = resolveTheme(theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Storage quota or restriction fallback
        }
        applyThemeToDOM(resolved);
        set({ theme, resolvedTheme: resolved });
    },

    toggleTheme: () => {
        const current = get().resolvedTheme;
        const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
    },

    initTheme: () => {
        const currentMode = get().theme;
        const resolved = resolveTheme(currentMode);
        applyThemeToDOM(resolved);
        set({ resolvedTheme: resolved });

        // Listen for OS color scheme changes when in 'system' mode
        if (typeof window !== 'undefined' && window.matchMedia && !mediaQueryListenerAttached) {
            mediaQueryListenerAttached = true;
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleMediaChange = () => {
                if (get().theme === 'system') {
                    const newResolved = getSystemTheme();
                    applyThemeToDOM(newResolved);
                    set({ resolvedTheme: newResolved });
                }
            };

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleMediaChange);
            } else if ((mediaQuery as any).addListener) {
                (mediaQuery as any).addListener(handleMediaChange);
            }
        }
    }
}));

// Self-initialize on client load
if (typeof window !== 'undefined') {
    useThemeStore.getState().initTheme();
    (window as any).useThemeStore = useThemeStore;
}
