import { renderHook } from '../../../../../test-utils';
import useOffsets from './useOffsets';

describe('useOffsets', () => {
  it('should return correct offsets when video size more that container size', () => {
    const mockedChildrenWidth = 200;
    const mockedChildrenHeight = 200;
    const mockedContainerWidth = 100;
    const mockedContainerHeight = 100;

    const { result } = renderHook(() =>
      useOffsets(
        mockedChildrenWidth,
        mockedChildrenHeight,
        mockedContainerWidth,
        mockedContainerHeight
      )
    );

    expect(result.current).toEqual({ x: 50, y: 50 });
  });

  it('should return correct offsets when video size the same as container size', () => {
    const mockedChildrenWidth = 100;
    const mockedChildrenHeight = 100;
    const mockedContainerWidth = 100;
    const mockedContainerHeight = 100;

    const { result } = renderHook(() =>
      useOffsets(
        mockedChildrenWidth,
        mockedChildrenHeight,
        mockedContainerWidth,
        mockedContainerHeight
      )
    );

    expect(result.current).toEqual({ x: 0, y: 0 });
  });
});
