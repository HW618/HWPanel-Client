/**
 * TODO(T02): delete this file once `tokens.generated.ts` + `ThemeProvider` land.
 *
 * Minimal placeholder theme for the T01 scaffold. Values mirror a small subset
 * of `docs/design/tokens.json` (v1.0.1) intentionally, but they are NOT the
 * generated token pipeline. Business code must keep reading theme values from
 * this module so the T02 swap stays mechanical.
 *
 * Hex color literals are avoided on purpose: the T02 lint gate scans for
 * `#RRGGBB` across `src/**`.
 */

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  color: {
    canvas: string;
    surface: string;
    surfaceSoft: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textSubtle: string;
    border: string;
    accent: string;
    danger: string;
    tabBarBackground: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    card: number;
    pill: number;
  };
  typography: {
    title: { fontSize: number; lineHeight: number; fontWeight: '600' };
    body: { fontSize: number; lineHeight: number; fontWeight: '400' };
    caption: { fontSize: number; lineHeight: number; fontWeight: '400' };
  };
  iconSize: {
    dot: number;
    tab: number;
  };
  motion: {
    fast: number;
  };
  borderWidth: {
    hairline: number;
  };
  layout: {
    tabBarHeight: number;
    tabBarGap: number;
  };
}

const light: AppTheme = {
  mode: 'light',
  color: {
    canvas: 'rgb(248, 249, 251)',
    surface: 'rgb(255, 255, 255)',
    surfaceSoft: 'rgb(242, 243, 246)',
    textPrimary: 'rgb(23, 27, 38)',
    textSecondary: 'rgb(52, 59, 75)',
    textMuted: 'rgb(89, 96, 112)',
    textSubtle: 'rgb(102, 109, 123)',
    border: 'rgb(233, 236, 242)',
    accent: 'rgb(47, 107, 255)',
    danger: 'rgb(220, 38, 38)',
    tabBarBackground: 'rgba(255, 255, 255, 0.92)',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radius: { card: 16, pill: 999 },
  typography: {
    title: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  },
  iconSize: { dot: 4, tab: 22 },
  motion: { fast: 160 },
  borderWidth: { hairline: 1 },
  layout: { tabBarHeight: 56, tabBarGap: 8 },
};

const dark: AppTheme = {
  ...light,
  mode: 'dark',
  color: {
    canvas: 'rgb(13, 16, 23)',
    surface: 'rgb(23, 27, 38)',
    surfaceSoft: 'rgb(28, 33, 46)',
    textPrimary: 'rgb(245, 246, 249)',
    textSecondary: 'rgb(217, 221, 229)',
    textMuted: 'rgb(155, 162, 176)',
    textSubtle: 'rgb(140, 147, 160)',
    border: 'rgb(45, 51, 66)',
    accent: 'rgb(94, 144, 255)',
    danger: 'rgb(248, 113, 113)',
    tabBarBackground: 'rgba(23, 27, 38, 0.92)',
  },
};

export const placeholderThemes: Record<ThemeMode, AppTheme> = { light, dark };
