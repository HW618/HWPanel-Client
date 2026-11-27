import { Stack } from 'expo-router';

/**
 * Own stack for the Overview tab. Allowed child routes per
 * contracts/local/routes.md: `metrics/[tab]` (tab ∈ cpu|memory|disk|network|processes).
 * Registered by T07; not created in T01.
 */
export default function OverviewLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
