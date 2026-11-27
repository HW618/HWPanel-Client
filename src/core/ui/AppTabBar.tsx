import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { useAppTheme } from '@/core/theme';

import { TabIcon, type TabIconName } from './icons/TabIcon';

/**
 * Only the 5 tab roots show the bar. Every child route of a tab (metrics,
 * container detail, website detail, ...) hides it, matching
 * `contracts/local/routes.md` §2.
 */
const TAB_ROOT_PATHS: ReadonlySet<string> = new Set([
  '/overview',
  '/containers',
  '/apps',
  '/tasks',
  '/more',
]);

type TabRouteName = 'overview' | 'containers' | 'apps' | 'tasks' | 'more';

const TAB_META: Record<TabRouteName, { label: TabTranslationKey; icon: TabIconName }> = {
  overview: { label: 'tabs.overview', icon: 'overview' },
  containers: { label: 'tabs.containers', icon: 'containers' },
  apps: { label: 'tabs.apps', icon: 'apps' },
  tasks: { label: 'tabs.tasks', icon: 'tasks' },
  more: { label: 'tabs.more', icon: 'more' },
};

type TabTranslationKey =
  'tabs.overview' | 'tabs.containers' | 'tabs.apps' | 'tabs.tasks' | 'tabs.more';

function isTabRouteName(name: string): name is TabRouteName {
  return Object.prototype.hasOwnProperty.call(TAB_META, name);
}

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  if (!TAB_ROOT_PATHS.has(pathname)) {
    return null;
  }

  return (
    <View
      // TODO(T02): swap the solid placeholder for BlurView once the expo-blur
      // intensity is calibrated against blur.tabBar (src/core/theme/blur.ts).
      style={[
        styles.bar,
        {
          height: theme.layout.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: theme.color.tabBarBackground,
          borderTopColor: theme.color.border,
          borderTopWidth: theme.borderWidth.hairline,
          gap: theme.layout.tabBarGap,
          paddingTop: theme.spacing.xs,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        if (!isTabRouteName(route.name)) {
          return null;
        }
        const meta = TAB_META[route.name];
        const focused = state.index === index;
        const tint = focused ? theme.color.accent : theme.color.textMuted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={t(meta.label)}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={[styles.item, { gap: theme.spacing.xs }]}
          >
            <TabIcon name={meta.icon} size={theme.iconSize.tab} color={tint} />
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: tint,
                  fontSize: theme.typography.caption.fontSize,
                  lineHeight: theme.typography.caption.lineHeight,
                },
              ]}
            >
              {t(meta.label)}
            </Text>
            <View
              style={{
                width: theme.iconSize.dot,
                height: theme.iconSize.dot,
                borderRadius: theme.radius.pill,
                backgroundColor: focused ? theme.color.accent : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
