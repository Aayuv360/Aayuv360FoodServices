import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If unauthorized and not already trying to refresh, attempt token refresh
  if (res.status === 401 && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login')) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (refreshRes.ok) {
        // Retry original request with new token
        res = await fetch(url, {
          method,
          headers: data ? { "Content-Type": "application/json" } : {},
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
      }
    } catch (refreshError) {
      console.log('Token refresh failed:', refreshError);
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    // If unauthorized and not already trying to refresh, attempt token refresh
    const url = queryKey[0] as string;
    if (res.status === 401 && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login')) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (refreshRes.ok) {
          // Retry original request with new token
          res = await fetch(url, {
            credentials: "include",
          });
        }
      } catch (refreshError) {
        console.log('Token refresh failed in query:', refreshError);
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
