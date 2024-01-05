import { renderHook } from '../../../../../test-utils';
import useMobileOrientation from './useMobileOrientation';

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn().mockReturnValue(true),
}));

const mockPortraitSize = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 300,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 600,
  });
};

const mockLandscapeSize = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 600,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 300,
  });
};

describe('useMobileOrientation', () => {
  it('should return correct data for portrait ', () => {
    mockPortraitSize();

    const { result } = renderHook(() => useMobileOrientation());

    expect(result.current.isPortrait).toEqual(true);
    expect(result.current.isLandscape).toEqual(false);
    expect(result.current.orientation).toEqual('portrait');
  });

  it('should return correct data for landscape ', () => {
    mockLandscapeSize();

    const { result } = renderHook(() => useMobileOrientation());

    expect(result.current.isPortrait).toEqual(false);
    expect(result.current.isLandscape).toEqual(true);
    expect(result.current.orientation).toEqual('landscape');
  });

  it('should handle orientation change', () => {
    mockLandscapeSize();

    const { result, rerender } = renderHook(() => useMobileOrientation());

    expect(result.current.isPortrait).toEqual(false);
    expect(result.current.isLandscape).toEqual(true);
    expect(result.current.orientation).toEqual('landscape');

    mockPortraitSize();
    global.dispatchEvent(new Event('resize'));
    rerender();

    expect(result.current.isPortrait).toEqual(true);
    expect(result.current.isLandscape).toEqual(false);
    expect(result.current.orientation).toEqual('portrait');
  });
});
