import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/core/theme';

interface TabPlaceholderProps {
  /** Already translated by the caller. */
  title: string;
  body: string;
}

/**
 * T01 scaffold surface for each tab root. Real screens arrive with their own
 * slices; this keeps the 5-tab shell honest (no fake interactions).
 */
export function TabPlaceholder({ title, body }: TabPlaceholderProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.color.canvas,
          paddingHorizontal: theme.spacing.xl,
          paddingTop: insets.top + theme.spacing.xl,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <Text
        accessibilityRole="header"
        style={{
          color: theme.color.textPrimary,
          fontSize: theme.typography.title.fontSize,
          lineHeight: theme.typography.title.lineHeight,
          fontWeight: theme.typography.title.fontWeight,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.color.textMuted,
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.lineHeight,
          fontWeight: theme.typography.body.fontWeight,
        }}
      >
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
