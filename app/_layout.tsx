import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/core/i18n';
import { createAppQueryClient } from '@/core/query/client';
import { logNativePingOnce } from '@/core/transport/devPing';

export default function RootLayout() {
  const [queryClient] = useState(() => createAppQueryClient());

  useEffect(() => {
    void logNativePingOnce();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = {
  root: { flex: 1 },
} as const;
