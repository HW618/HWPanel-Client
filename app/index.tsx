import { Redirect } from 'expo-router';

/**
 * Boot placeholder. TODO(T04): replace with `resolveEntry()` from the server
 * registry (`/servers`, `/servers/connect` or the default server's overview).
 */
export default function Index() {
  return <Redirect href="/(tabs)/overview" />;
}
