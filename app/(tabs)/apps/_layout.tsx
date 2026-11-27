import { Stack } from 'expo-router';

/**
 * Own stack for the Apps tab. Allowed child routes per
 * contracts/local/routes.md: `catalog/[appId]`, `catalog/[appId]/install`,
 * `tasks/[taskId]`, `installed/[id]`. Registered by T10; not created in T01.
 */
export default function AppsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
