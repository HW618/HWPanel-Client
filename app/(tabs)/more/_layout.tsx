import { Stack } from 'expo-router';

/**
 * Own stack for the More tab. Allowed child routes per
 * contracts/local/routes.md: `websites`, `websites/[siteId]` (read-only).
 * Registered by T12; not created in T01.
 */
export default function MoreLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
