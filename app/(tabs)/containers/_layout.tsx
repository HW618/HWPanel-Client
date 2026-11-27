import { Stack } from 'expo-router';

/**
 * Own stack for the Containers tab. Allowed child routes per
 * contracts/local/routes.md: `[kind]/[id]` (kind ∈ container|compose).
 * Registered by T08/T09; not created in T01.
 */
export default function ContainersLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
