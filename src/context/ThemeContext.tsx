import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ThemeMode, ThemeAccent, ThemeFont, ThemeFontSize, ThemeContrastMode, ThemeFontWeight } from '../types';
import { applyThemeCustomColors } from '../utils/themeUtils';

export interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: 'dark' | 'light';
  themeAccent: ThemeAccent;
  themeCustomAccent: string;
  themeFont: ThemeFont;
  themeFontSize: ThemeFontSize;
  themeContrastMode: ThemeContrastMode;
  themeFontWeight: ThemeFontWeight;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeAccent: (accent: ThemeAccent) => void;
  setThemeCustomAccent: (hex: string) => void;
  setThemeFont: (font: ThemeFont) => void;
  setThemeFontSize: (size: ThemeFontSize) => void;
  setThemeContrastMode: (mode: ThemeContrastMode) => void;
  setThemeFontWeight: (weight: ThemeFontWeight) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Read initial theme settings from local storage
  const initialSettings = (() => {
    try {
      const saved = localStorage.getItem('qr_presensi_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  })();

  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialSettings.themeMode || 'dark');
  const [themeAccent, setThemeAccentState] = useState<ThemeAccent>(initialSettings.themeAccent || 'emerald');
  const [themeCustomAccent, setThemeCustomAccentState] = useState<string>(initialSettings.themeCustomAccent || '#10b981');
  const [themeFont, setThemeFontState] = useState<ThemeFont>(initialSettings.themeFont || 'plus-jakarta');
  const [themeFontSize, setThemeFontSizeState] = useState<ThemeFontSize>(initialSettings.themeFontSize || 'normal');
  const [themeContrastMode, setThemeContrastModeState] = useState<ThemeContrastMode>(initialSettings.themeContrastMode || 'normal');
  const [themeFontWeight, setThemeFontWeightState] = useState<ThemeFontWeight>(initialSettings.themeFontWeight || 'normal');

  // System Dark Mode Detection
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const effectiveTheme: 'dark' | 'light' = themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;

  // Persist updated theme to localStorage settings
  const persistThemeSettings = (patch: Record<string, any>) => {
    try {
      const saved = localStorage.getItem('qr_presensi_settings');
      const current = saved ? JSON.parse(saved) : {};
      const updated = { ...current, ...patch };
      localStorage.setItem('qr_presensi_settings', JSON.stringify(updated));
    } catch (e) {}
  };

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    persistThemeSettings({ themeMode: mode });
  }, []);

  const setThemeAccent = useCallback((accent: ThemeAccent) => {
    setThemeAccentState(accent);
    persistThemeSettings({ themeAccent: accent });
  }, []);

  const setThemeCustomAccent = useCallback((hex: string) => {
    setThemeCustomAccentState(hex);
    persistThemeSettings({ themeCustomAccent: hex });
  }, []);

  const setThemeFont = useCallback((font: ThemeFont) => {
    setThemeFontState(font);
    persistThemeSettings({ themeFont: font });
  }, []);

  const setThemeFontSize = useCallback((size: ThemeFontSize) => {
    setThemeFontSizeState(size);
    persistThemeSettings({ themeFontSize: size });
  }, []);

  const setThemeContrastMode = useCallback((mode: ThemeContrastMode) => {
    setThemeContrastModeState(mode);
    persistThemeSettings({ themeContrastMode: mode });
  }, []);

  const setThemeFontWeight = useCallback((weight: ThemeFontWeight) => {
    setThemeFontWeightState(weight);
    persistThemeSettings({ themeFontWeight: weight });
  }, []);

  // Apply theme attributes to document and root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-accent', themeAccent);
    root.setAttribute('data-font', themeFont);
    root.setAttribute('data-font-size', themeFontSize);
    root.setAttribute('data-contrast', themeContrastMode);
    root.setAttribute('data-font-weight', themeFontWeight);

    if (document.body) {
      document.body.setAttribute('data-font', themeFont);
      document.body.setAttribute('data-font-size', themeFontSize);
      document.body.setAttribute('data-contrast', themeContrastMode);
      document.body.setAttribute('data-font-weight', themeFontWeight);
    }

    applyThemeCustomColors(themeAccent, themeCustomAccent);

    if (effectiveTheme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      root.classList.remove('dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.add('dark');
      root.classList.remove('theme-light');
    }
  }, [effectiveTheme, themeAccent, themeCustomAccent, themeFont, themeFontSize, themeContrastMode, themeFontWeight]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        effectiveTheme,
        themeAccent,
        themeCustomAccent,
        themeFont,
        themeFontSize,
        themeContrastMode,
        themeFontWeight,
        setThemeMode,
        setThemeAccent,
        setThemeCustomAccent,
        setThemeFont,
        setThemeFontSize,
        setThemeContrastMode,
        setThemeFontWeight,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
