import { useCallback, useRef } from 'react';

/**
 * Creates a stable callback that doesn't change reference on re-renders
 * but always calls the latest version of the callback
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T, []);
}