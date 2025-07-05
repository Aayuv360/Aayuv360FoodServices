import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface CacheConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
}

// Default cache configurations for different data types
const DEFAULT_CACHE_CONFIGS: Record<string, CacheConfig> = {
  meals: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  },
  subscriptionPlans: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  },
  user: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  },
  cart: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  },
  orders: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
  },
};

export function useApiCache() {
  const queryClient = useQueryClient();

  const invalidateCache = useCallback((keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  const clearCache = useCallback((keys?: string[]) => {
    if (keys) {
      keys.forEach(key => {
        queryClient.removeQueries({ queryKey: [key] });
      });
    } else {
      queryClient.clear();
    }
  }, [queryClient]);

  const prefetchData = useCallback(async (
    key: string,
    fetchFn: () => Promise<any>,
    config?: CacheConfig
  ) => {
    const cacheConfig = { ...DEFAULT_CACHE_CONFIGS[key], ...config };
    
    await queryClient.prefetchQuery({
      queryKey: [key],
      queryFn: fetchFn,
      ...cacheConfig,
    });
  }, [queryClient]);

  const getCachedData = useCallback((key: string) => {
    return queryClient.getQueryData([key]);
  }, [queryClient]);

  const setCachedData = useCallback((key: string, data: any) => {
    queryClient.setQueryData([key], data);
  }, [queryClient]);

  return {
    invalidateCache,
    clearCache,
    prefetchData,
    getCachedData,
    setCachedData,
    DEFAULT_CACHE_CONFIGS,
  };
}

// Enhanced API hook with automatic caching
export function useCachedApi<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    cacheConfig?: CacheConfig;
  }
) {
  const cacheConfig = {
    ...DEFAULT_CACHE_CONFIGS[key],
    ...options?.cacheConfig,
  };

  return useQuery({
    queryKey: [key],
    queryFn: fetchFn,
    enabled: options?.enabled !== false,
    ...cacheConfig,
  });
}