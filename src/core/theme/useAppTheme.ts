import { useColorScheme } from 'react-native';

import { placeholderThemes, type AppTheme } from './placeholder';

/**
 * TODO(T02): replace with the generated tokens + `ThemeProvider` so the user
 * preference (system / light / dark) can override the OS setting.
 */
export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? placeholderThemes.dark : placeholderThemes.light;
}
