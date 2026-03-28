/**
 * ThemeContext — provides dynamic colors based on the selected app theme.
 * Supports 'system' theme that follows Android/iOS dark mode automatically.
 * Wrap the app at root level. Screens read from useTheme().
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getLocalProfile } from '../lib/localStore';
import type { AppTheme } from '../types';

export interface ThemeColors {
  // Backgrounds
  bg: string;
  card: string;
  cardBorder: string;
  tabBar: string;
  header: string;
  surfaceLow: string;
  surfaceContainer: string;
  surfaceHigh: string;
  surfaceHighest: string;
  surfaceLowest: string;
  // Text
  text: string;
  subText: string;
  // Primary accent (buttons, highlights, chips)
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  // Secondary accent (graphs, progress, warnings)
  accent: string;
  accentContainer: string;
  // Borders & outlines
  outline: string;
  outlineVariant: string;
  // Semantic
  error: string;
  isDark: boolean;
}

const THEME_PALETTE: Record<Exclude<AppTheme, 'system'>, ThemeColors> = {
  'warm-cream': {
    bg: '#FFF8F5',
    card: '#F9F2EF',
    cardBorder: '#D5C2C5',
    tabBar: '#FFF8F5',
    header: '#FFF8F5',
    surfaceLow: '#F9F2EF',
    surfaceContainer: '#F3ECEA',
    surfaceHigh: '#EDE7E4',
    surfaceHighest: '#E8E1DE',
    surfaceLowest: '#FFFFFF',
    text: '#1D1B1A',
    subText: '#514346',
    primary: '#864D5F',
    primaryContainer: '#C9879A',
    onPrimary: '#FFFFFF',
    accent: '#994530',
    accentContainer: '#FFDAD2',
    outline: '#837376',
    outlineVariant: '#D5C2C5',
    error: '#BA1A1A',
    isDark: false,
  },
  'dark-walnut': {
    bg: '#2A1F17',
    card: '#3A2D23',
    cardBorder: '#4A3C30',
    tabBar: '#221A12',
    header: '#221A12',
    surfaceLow: '#3A2D23',
    surfaceContainer: '#4A3C30',
    surfaceHigh: '#5A4C3C',
    surfaceHighest: '#6A5C4C',
    surfaceLowest: '#2A1F17',
    text: '#F5EDE3',
    subText: '#A89080',
    primary: '#D4A574',
    primaryContainer: '#8C6540',
    onPrimary: '#FFFFFF',
    accent: '#E8B87A',
    accentContainer: '#5C3A1E',
    outline: '#8A7A6A',
    outlineVariant: '#5A4A3A',
    error: '#CF6679',
    isDark: true,
  },
  'soft-sage': {
    bg: '#EAF0EA',
    card: '#F2F7F2',
    cardBorder: '#D0DDD0',
    tabBar: '#EAF0EA',
    header: '#EAF0EA',
    surfaceLow: '#E2EDE2',
    surfaceContainer: '#D8E8D8',
    surfaceHigh: '#CDE0CD',
    surfaceHighest: '#C2D8C2',
    surfaceLowest: '#F2F7F2',
    text: '#2D402D',
    subText: '#6B8A6B',
    primary: '#4A7C59',
    primaryContainer: '#7AAB8A',
    onPrimary: '#FFFFFF',
    accent: '#8B6F47',
    accentContainer: '#D4B896',
    outline: '#6A8A6A',
    outlineVariant: '#B8CCB8',
    error: '#BA1A1A',
    isDark: false,
  },
  'lavender': {
    bg: '#F0EAF8',
    card: '#F7F2FC',
    cardBorder: '#D8CCE8',
    tabBar: '#EDE5F8',
    header: '#F0EAF8',
    surfaceLow: '#E8E0F2',
    surfaceContainer: '#E0D8EC',
    surfaceHigh: '#D8D0E6',
    surfaceHighest: '#D0C8E0',
    surfaceLowest: '#F7F2FC',
    text: '#3D2D52',
    subText: '#7B6A9A',
    primary: '#7B5EA7',
    primaryContainer: '#A88CC8',
    onPrimary: '#FFFFFF',
    accent: '#C48BB4',
    accentContainer: '#F0D8E8',
    outline: '#8B7AB0',
    outlineVariant: '#C8BAD8',
    error: '#BA1A1A',
    isDark: false,
  },
};

function resolveTheme(theme: AppTheme, systemIsDark: boolean): Exclude<AppTheme, 'system'> {
  if (theme === 'system') {
    return systemIsDark ? 'dark-walnut' : 'warm-cream';
  }
  return theme;
}

interface ThemeContextValue {
  theme: AppTheme;
  colors: ThemeColors;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'warm-cream',
  colors: THEME_PALETTE['warm-cream'],
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const systemIsDark = systemColorScheme === 'dark';
  const [theme, setThemeState] = useState<AppTheme>('warm-cream');

  // Load persisted theme from local store on mount
  useEffect(() => {
    getLocalProfile().then((profile) => {
      if (profile.theme) setThemeState(profile.theme);
    });
  }, []);

  const setTheme = (t: AppTheme) => setThemeState(t);

  const resolvedTheme = resolveTheme(theme, systemIsDark);
  const colors = THEME_PALETTE[resolvedTheme];

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { THEME_PALETTE };
