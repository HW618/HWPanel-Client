import { Tabs } from 'expo-router';

import { useTranslation } from '@/core/i18n';
import { AppTabBar } from '@/core/ui';

/**
 * Five MVP tabs, fixed order (docs/prd.md §3.2). Each tab owns a nested Stack
 * so detail pages push inside the tab and the tab bar hides on child routes.
 */
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="overview" options={{ title: t('tabs.overview') }} />
      <Tabs.Screen name="containers" options={{ title: t('tabs.containers') }} />
      <Tabs.Screen name="apps" options={{ title: t('tabs.apps') }} />
      <Tabs.Screen name="tasks" options={{ title: t('tabs.tasks') }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.more') }} />
    </Tabs>
  );
}
