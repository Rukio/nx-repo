import { renderHook } from '../../testUtils';
import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should debounce call of the function', async () => {
    const callback = vi.fn((value: string) => value);
    const mockDelayMs = 500;
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, mockDelayMs)
    );

    result.current('1');

    expect(callback).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(mockDelayMs / 2);

    expect(callback).toHaveBeenCalledTimes(0);

    vi.advanceTimersToNextTimer();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('1');
  });

  it('should clear previous calls of the function', async () => {
    const callback = vi.fn((value: string) => value);
    const mockDelayMs = 500;
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, mockDelayMs)
    );

    result.current('1');
    result.current('2');

    expect(callback).toHaveBeenCalledTimes(0);

    vi.advanceTimersToNextTimer();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('2');
  });
});
