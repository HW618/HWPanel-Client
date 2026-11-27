import { QueryClient } from '@tanstack/react-query';

/**
 * TODO(T05): replace with a per-server QueryClient partition once
 * `PanelClient` exists. Every queryKey must start with `serverId`
 * (docs/architecture.md §3).
 */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5_000,
      },
    },
  });
}
