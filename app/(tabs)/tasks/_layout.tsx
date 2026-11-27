import { Stack } from 'expo-router';

/**
 * Own stack for the Tasks tab. Allowed child routes per
 * contracts/local/routes.md: `[taskId]`. Registered by T11; not created in T01.
 */
export default function TasksLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
