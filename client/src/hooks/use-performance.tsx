import { useEffect, useCallback } from "react";
import { useApiCache } from "./use-api-cache";

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export function usePerformanceMonitoring() {
  const { prefetchData } = useApiCache();

  const logPerformanceMetrics = useCallback(() => {
    if ("performance" in window) {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");

      const metrics: Partial<PerformanceMetrics> = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint:
          paint.find((p) => p.name === "first-contentful-paint")?.startTime ||
          0,
      };

      if (process.env.NODE_ENV === "development") {
        console.group("🚀 Performance Metrics");

        console.groupEnd();
      }
    }
  }, []);

  const prefetchCriticalData = useCallback(async () => {
    try {
      await Promise.allSettled([
        prefetchData("meals", () => fetch("/api/meals").then((r) => r.json())),
        prefetchData("subscriptionPlans", () =>
          fetch("/api/subscription-plans").then((r) => r.json()),
        ),
      ]);
    } catch (error) {
      console.warn("Failed to prefetch critical data:", error);
    }
  }, [prefetchData]);

  useEffect(() => {
    // Monitor performance on page load
    if (document.readyState === "complete") {
      logPerformanceMetrics();
    } else {
      window.addEventListener("load", logPerformanceMetrics);
      return () => window.removeEventListener("load", logPerformanceMetrics);
    }
  }, [logPerformanceMetrics]);

  useEffect(() => {
    // Prefetch critical data after initial load
    const timer = setTimeout(prefetchCriticalData, 1000);
    return () => clearTimeout(timer);
  }, [prefetchCriticalData]);

  return {
    logPerformanceMetrics,
    prefetchCriticalData,
  };
}

// Image preloader hook
export function useImagePreloader() {
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(
    async (imageSrcs: string[]) => {
      try {
        await Promise.allSettled(imageSrcs.map(preloadImage));
      } catch (error) {
        console.warn("Some images failed to preload:", error);
      }
    },
    [preloadImage],
  );

  return {
    preloadImage,
    preloadImages,
  };
}

// Bundle splitting utilities
export const LazyComponents = {
  AdminPortal: () =>
    import("@/pages/admin-portal").then((m) => ({ default: m.default })),
  Analytics: () =>
    import("@/pages/analytics").then((m) => ({ default: m.default })),
  OrderManagement: () =>
    import("@/pages/order-management").then((m) => ({ default: m.default })),
};

// Memory optimization hook
export function useMemoryOptimization() {
  const clearUnusedData = useCallback(() => {
    // Clear browser caches that might be taking up memory
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes("old") || name.includes("unused")) {
            caches.delete(name);
          }
        });
      });
    }
  }, []);

  useEffect(() => {
    // Clear unused data periodically
    const interval = setInterval(clearUnusedData, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [clearUnusedData]);

  return {
    clearUnusedData,
  };
}
