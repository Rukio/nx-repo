import { useCallback, useRef } from 'react';

export const useDebouncedCallback = <T>(
  fn: (value: T) => void,
  delay = 300
): ((value: T) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (value: T) => {
      clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => fn(value), delay);
    },
    [delay, fn]
  );
};
