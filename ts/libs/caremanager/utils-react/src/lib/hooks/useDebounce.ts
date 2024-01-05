import { useCallback, useEffect, useState } from 'react';

/**
 * Triggers a callback after the provided time has passed, the callback needs
 * to be memoized with `useCallback`
 *
 * @param callback The callback to be triggered.
 * @param time The total time in milliseconds to trigger the callback.
 */
export const useDebouncedEffect = (callback: () => void, time: number) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      callback();
    }, time);

    return () => {
      clearTimeout(timeout);
    };
  }, [callback, time]);
};

export const useDebounce = <T>(value: T, delay: number) => {
  const [debounceValue, setDebounceValue] = useState<T>(value);

  useDebouncedEffect(
    useCallback(() => setDebounceValue(value), [value]),
    delay
  );

  return debounceValue;
};
